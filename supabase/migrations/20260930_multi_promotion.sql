-- ========================================================
-- MIGRACIÓN MULTI-PROMOCIÓN: LUBENS ARROYO & LUBENS FARNESIO
-- ========================================================

-- 1. Añadir columna 'promocion' a la tabla de inventario de viviendas
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS promocion TEXT DEFAULT 'arroyo' NOT NULL;

-- Asignar las viviendas existentes actualmente a 'arroyo'
UPDATE public.inventory 
SET promocion = 'arroyo' 
WHERE promocion IS NULL OR promocion = '';

-- Crear índice para optimizar consultas de inventario por promoción
CREATE INDEX IF NOT EXISTS idx_inventory_promocion ON public.inventory(promocion);


-- 2. Añadir columna 'promocion_interes' a la tabla de clientes (leads)
-- Valores posibles: 'arroyo', 'farnesio', 'ambas'
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS promocion_interes TEXT DEFAULT 'arroyo' NOT NULL;

-- Asignar los clientes existentes actualmente a 'arroyo'
UPDATE public.leads 
SET promocion_interes = 'arroyo' 
WHERE promocion_interes IS NULL OR promocion_interes = '';

-- Crear índice para agilizar filtros y búsquedas en clientes
CREATE INDEX IF NOT EXISTS idx_leads_promocion_interes ON public.leads(promocion_interes);
