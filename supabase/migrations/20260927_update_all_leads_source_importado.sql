-- =====================================================
-- MIGRACIÓN: Actualizar origen de contactos a 'Importado'
-- Fecha: 2026-09-27
-- =====================================================

-- 1. Actualizar el origen de todos los clientes existentes a 'Importado'
UPDATE public.leads
SET source = 'Importado';

-- 2. Asegurar comentario descriptivo en la columna source
COMMENT ON COLUMN public.leads.source IS 'Origen del contacto: Importado, Idealista, Web, Google SEM, Redes Sociales, Referido, Llamada, Valla';
