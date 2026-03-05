-- SEED DATA PARA PRUEBAS (MVP SPRINT 1 Y 2)
-- UUIDs proporcionados:
-- Jefe: a95dd1b2-2038-4fc7-be00-cf3e10af5ca5
-- Comprador: f17778c6-540b-4f0c-bfe8-cd00a34d50d3

-- 0. Asegurar soporte del Enum para anulación
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'anulado';

-- 0.1 Asegurar existencia de tabla de Notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1. Asegurar Jerarquía en Perfiles
-- (Asumiendo que los perfiles ya existen, actualizamos sus roles y jerarquía)
UPDATE public.profiles 
SET role = 'jefe', department = 'Sistemas'
WHERE id = 'a95dd1b2-2038-4fc7-be00-cf3e10af5ca5';

UPDATE public.profiles 
SET role = 'comprador', department = 'Sistemas', boss_id = 'a95dd1b2-2038-4fc7-be00-cf3e10af5ca5'
WHERE id = 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3';

-- 2. Limpiar tablas transaccionales en el orden correcto (Cascade)
TRUNCATE public.audit_logs CASCADE;
TRUNCATE public.request_items CASCADE;
TRUNCATE public.requests CASCADE;
TRUNCATE public.products CASCADE;
-- Mantenemos los perfiles intactos

-- 3. Crear Productos (El Catálogo Dinámico)
-- Usamos UUIDs estáticos para facilitar la referencia en inserts
INSERT INTO public.products (id, name, description, price, is_active) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'Licencia M365 Business', 'Licencia un año corporativa', 150.00, true),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 'Monitor Dell 27"', 'Monitor externo para diseño', 350.50, true),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000003', 'Teclado Mecánico Keychron', 'Teclado para desarrolladores', 110.00, true),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000004', 'Silla Ergonómica Herman Miller', 'Silla premium oficina', 1200.00, true);

-- 4. Crear Solicitudes Antiguas para Poblar el Historial
-- Solicitud 1: Ya fue aprobada en el pasado
INSERT INTO public.requests (id, user_id, title, description, amount, status, created_at) VALUES
('cccccccc-cccc-cccc-cccc-000000000001', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'Renovación Licencias Abril', 'Licencias necesarias para el equipo', 450.00, 'aprobado', now() - interval '5 days');

INSERT INTO public.request_items (request_id, product_id, quantity, unit_price) VALUES
('cccccccc-cccc-cccc-cccc-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 3, 150.00);

-- Solicitud 2: Solicitud Nueva en Pendiente Jefe (Para que tu Jefe la vea en su bandeja)
INSERT INTO public.requests (id, user_id, title, description, amount, status, created_at) VALUES
('cccccccc-cccc-cccc-cccc-000000000002', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'Equipamiento Nuevo Ingreso', 'Para el nuevo dev del equipo', 460.50, 'pendiente_jefe', now() - interval '1 hour');

INSERT INTO public.request_items (request_id, product_id, quantity, unit_price) VALUES
('cccccccc-cccc-cccc-cccc-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 1, 350.50),
('cccccccc-cccc-cccc-cccc-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000003', 1, 110.00);

-- Solicitud 3: Fue rechazada
INSERT INTO public.requests (id, user_id, title, description, amount, status, rejection_reason, created_at) VALUES
('cccccccc-cccc-cccc-cccc-000000000003', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'Silla Presidencial', 'Me duele la espalda', 1200.00, 'rechazado', 'Monto excesivo, favor cotizar opción estándar', now() - interval '2 days');

INSERT INTO public.request_items (request_id, product_id, quantity, unit_price) VALUES
('cccccccc-cccc-cccc-cccc-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000004', 1, 1200.00);

-- 5. Llenar Historicos en Bitácora
INSERT INTO public.audit_logs (request_id, changed_by_user, action, timestamp) VALUES
('cccccccc-cccc-cccc-cccc-000000000001', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'creacion', now() - interval '5 days'),
('cccccccc-cccc-cccc-cccc-000000000001', 'a95dd1b2-2038-4fc7-be00-cf3e10af5ca5', 'aprobacion', now() - interval '4 days'),
('cccccccc-cccc-cccc-cccc-000000000002', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'creacion', now() - interval '1 hour'),
('cccccccc-cccc-cccc-cccc-000000000003', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'creacion', now() - interval '2 days'),
('cccccccc-cccc-cccc-cccc-000000000003', 'a95dd1b2-2038-4fc7-be00-cf3e10af5ca5', 'rechazo', now() - interval '1 day');
