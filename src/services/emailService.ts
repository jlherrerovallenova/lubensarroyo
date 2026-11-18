import { supabase } from '../lib/supabase';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  bcc?: string[];
}

/**
 * Obtiene la clave de API de Resend comprobando en orden:
 * 1. Variable de entorno VITE_RESEND_API_KEY
 * 2. Tabla 'settings' de Supabase (guardada desde Configuración > Integraciones)
 */
export async function getResendApiKey(): Promise<string> {
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RESEND_API_KEY)
    ? import.meta.env.VITE_RESEND_API_KEY
    : (typeof process !== 'undefined' ? process.env?.VITE_RESEND_API_KEY : '');

  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  try {
    const { data } = await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'resend_api_key')
      .maybeSingle();

    if (data?.value && data.value.trim()) {
      return data.value.trim();
    }
  } catch (err) {
    console.warn('Error al consultar resend_api_key de la base de datos:', err);
  }

  return '';
}

/**
 * Envía un correo electrónico utilizando Resend:
 * - Intenta primero a través de la Supabase Edge Function `send-email`.
 * - Si la Edge Function no está desplegada (404) o falla, utiliza el proxy local /api/resend.
 */
export async function sendEmail({ to, subject, html, from, bcc }: SendEmailParams): Promise<{ success: boolean; id?: string }> {
  const apiKey = await getResendApiKey();
  const recipientList = Array.isArray(to) ? to : [to];

  // 1. Intentar invocar la Edge Function de Supabase
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipientList.length === 1 ? recipientList[0] : recipientList,
        subject,
        html,
        from: from || 'Lubens Arroyo <info@terravallpromociones.com>',
        bcc: bcc || ['terravall@lubensarroyo.es'],
        resendApiKey: apiKey || undefined,
      },
    });

    if (!error && !data?.error) {
      return { success: true, id: data?.id };
    }

    // Si la función responde con error que no sea 404, extraer mensaje
    const errMsg = data?.error || error?.message || '';
    if (errMsg && !errMsg.includes('404') && !errMsg.includes('Not Found')) {
      console.warn('Supabase Edge Function error:', errMsg);
    }
  } catch (err) {
    console.warn('Supabase Edge Function send-email invoke error, intentando envío alternativo:', err);
  }

  // 2. Si la Edge Function no está disponible o falló, utilizar el proxy de Resend
  if (!apiKey) {
    throw new Error(
      'No se ha configurado la API Key de Resend. Por favor, añádela en Configuración > Integraciones > Resend API Key o en el archivo .env como VITE_RESEND_API_KEY.'
    );
  }

  const response = await fetch('/api/resend/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from || 'Lubens Arroyo <info@terravallpromociones.com>',
      to: recipientList,
      bcc: bcc || ['terravall@lubensarroyo.es'],
      subject,
      html,
    }),
  });

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData?.message || `Error enviando correo con Resend (${response.status})`);
  }

  return { success: true, id: resData.id };
}
