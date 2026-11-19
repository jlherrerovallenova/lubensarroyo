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
 * - Si está en entorno de desarrollo local (Vite) y la función no está desplegada, recurre al proxy local /api/resend.
 * - En producción (Bolt, Netlify, Vercel, etc.), informa claramente si la Edge Function no está desplegada o si falló.
 */
export async function sendEmail({ to, subject, html, from, bcc }: SendEmailParams): Promise<{ success: boolean; id?: string }> {
  const apiKey = await getResendApiKey();
  const recipientList = Array.isArray(to) ? to : [to];

  let edgeFunctionError: string | null = null;
  let isFunctionNotFound = false;

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

    if (data?.error) {
      edgeFunctionError = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }

    if (error) {
      if ('context' in error && (error as any).context instanceof Response) {
        const resp = (error as any).context as Response;
        if (resp.status === 404) {
          isFunctionNotFound = true;
        }
        try {
          const cloned = resp.clone();
          const ct = cloned.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const errJson = await cloned.json();
            edgeFunctionError = errJson.error || errJson.message || edgeFunctionError;
          } else {
            const text = await cloned.text();
            if (text && !text.includes('<!DOCTYPE')) {
              edgeFunctionError = text;
            }
          }
        } catch {
          // ignore error reading context
        }
      }
      if (!edgeFunctionError) {
        edgeFunctionError = error.message || 'Error desconocido al invocar la función.';
      }
      if (edgeFunctionError && (edgeFunctionError.includes('404') || edgeFunctionError.includes('Not Found') || edgeFunctionError.includes('Failed to send a request'))) {
        isFunctionNotFound = true;
      }
    }
  } catch (err: any) {
    edgeFunctionError = err?.message || 'Error de conexión con la Edge Function';
    if (edgeFunctionError && (edgeFunctionError.includes('404') || edgeFunctionError.includes('Failed to send'))) {
      isFunctionNotFound = true;
    }
  }

  // 2. Si estamos en producción (Bolt, Vercel, Netlify, etc.), el proxy /api/resend NO existe
  const isDev = Boolean(import.meta.env?.DEV);
  if (!isDev) {
    if (isFunctionNotFound) {
      throw new Error(
        'La función "send-email" no está desplegada en tu proyecto de Supabase. Al desplegar en Bolt, debes desplegar las Edge Functions en Supabase ejecutando: `npx supabase functions deploy send-email`.'
      );
    }
    throw new Error(
      edgeFunctionError || 'Error al enviar el correo a través de Supabase Edge Function.'
    );
  }

  // 3. Fallback exclusivo para desarrollo local (Vite dev server con proxy /api/resend)
  console.warn('Edge Function no disponible en entorno local, intentando proxy /api/resend:', edgeFunctionError);

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

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawText = await response.text();
    if (rawText.includes('<!DOCTYPE')) {
      throw new Error(
        'El servidor local no tiene configurado el proxy hacia Resend o la ruta no existe.'
      );
    }
    throw new Error(`Respuesta inválida del servidor: ${rawText.slice(0, 100)}`);
  }

  const resData = await response.json();

  if (!response.ok) {
    throw new Error(resData?.message || `Error enviando correo con Resend (${response.status})`);
  }

  return { success: true, id: resData.id };
}
