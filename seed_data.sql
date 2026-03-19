-- SEED DATA PARA DEMO SPRINT 2
-- 0. Asegurar soporte del Enum para anulación
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'anulado';

-- 0.1 Asegurar existencia de tabla y columnas de Notificaciones (por si acaso)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 1. Actualizar roles en Profiles (asumiendo que los perfiles ya existen)
-- JEFE
UPDATE public.profiles SET role = 'jefe', department = 'Sistemas', boss_id = NULL WHERE id = 'a95dd1b2-2038-4fc7-be00-cf3e10af5ca5';
-- FINANCIERO 1
UPDATE public.profiles SET role = 'financiero_1', department = 'Finanzas', boss_id = NULL WHERE id = 'da53f478-66de-4f73-957a-4bb124f1d058';
-- COMPRADOR
UPDATE public.profiles SET role = 'comprador', department = 'Sistemas', boss_id = 'a95dd1b2-2038-4fc7-be00-cf3e10af5ca5' WHERE id = 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3';

-- 2. Limpiar tablas transaccionales en el orden correcto para un seed limpio
TRUNCATE public.audit_logs CASCADE;
TRUNCATE public.notifications CASCADE;
TRUNCATE public.request_items CASCADE;
TRUNCATE public.requests CASCADE;
TRUNCATE public.products CASCADE;

-- 3. Crear Productos (El Catálogo Dinámico)
INSERT INTO public.products (id, name, description, price, is_active) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'Licencia M365 Business', 'Licencia anual corporativa', 150.00, true),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 'Monitor Dell 27"', 'Monitor 4K para diseño', 350.50, true),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000003', 'Teclado Mecánico Keychron', 'Teclado switch brown', 110.00, true),
('bbbbbbbb-bbbb-bbbb-bbbb-000000000004', 'Silla Ergonómica Herman Miller', 'Silla premium oficina', 1200.00, true);

-- 4. Crear Solicitudes de Demo
-- 4.1. Solicitud 1: Aprobada
INSERT INTO public.requests (id, user_id, title, description, amount, status, created_at) VALUES
('cccccccc-cccc-cccc-cccc-000000000001', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'Renovación Licencias Abril', 'Licencias para el equipo de desarrollo', 450.00, 'aprobado', now() - interval '3 days');

INSERT INTO public.request_items (request_id, product_id, quantity, unit_price) VALUES
('cccccccc-cccc-cccc-cccc-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 3, 150.00);

-- 4.2. Solicitud 2: Pendiente Jefe (para la bandeja del Jefe)
INSERT INTO public.requests (id, user_id, title, description, amount, status, created_at) VALUES
('cccccccc-cccc-cccc-cccc-000000000002', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'Equipamiento Nuevo Ingreso', 'Para el nuevo dev del equipo', 460.50, 'pendiente_jefe', now() - interval '2 hours');

INSERT INTO public.request_items (request_id, product_id, quantity, unit_price) VALUES
('cccccccc-cccc-cccc-cccc-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002', 1, 350.50),
('cccccccc-cccc-cccc-cccc-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000003', 1, 110.00);

-- 4.3. Solicitud 3: Pendiente Financiero (pasó por el jefe, va al financiero 1)
INSERT INTO public.requests (id, user_id, title, description, amount, status, created_at) VALUES
('cccccccc-cccc-cccc-cccc-000000000003', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'Sillas para gerencia', 'Mobiliario nuevo', 1200.00, 'pendiente_financiero', now() - interval '1 day');

INSERT INTO public.request_items (request_id, product_id, quantity, unit_price) VALUES
('cccccccc-cccc-cccc-cccc-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-000000000004', 1, 1200.00);

-- 5. Llenar Historicos en Bitácora
INSERT INTO public.audit_logs (request_id, changed_by_user, action, timestamp) VALUES
('cccccccc-cccc-cccc-cccc-000000000001', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'creacion', now() - interval '3 days'),
('cccccccc-cccc-cccc-cccc-000000000001', 'a95dd1b2-2038-4fc7-be00-cf3e10af5ca5', 'aprobacion', now() - interval '2 days'),
('cccccccc-cccc-cccc-cccc-000000000001', 'da53f478-66de-4f73-957a-4bb124f1d058', 'aprobacion', now() - interval '1 day'),
('cccccccc-cccc-cccc-cccc-000000000002', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'creacion', now() - interval '2 hours'),
('cccccccc-cccc-cccc-cccc-000000000003', 'f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'creacion', now() - interval '2 days'),
('cccccccc-cccc-cccc-cccc-000000000003', 'a95dd1b2-2038-4fc7-be00-cf3e10af5ca5', 'aprobacion', now() - interval '1 day');

-- 6. Notificación para el Financiero y Comprador (usando is_read de tu esquema)
INSERT INTO public.notifications (user_id, request_id, message, is_read, created_at) VALUES
('da53f478-66de-4f73-957a-4bb124f1d058', 'cccccccc-cccc-cccc-cccc-000000000003', 'Nueva solicitud "Sillas para gerencia" en tu bandeja para aprobación.', false, now()),
('f17778c6-540b-4f0c-bfe8-cd00a34d50d3', 'cccccccc-cccc-cccc-cccc-000000000001', 'Tu solicitud "Renovación Licencias Abril" ha sido APROBADA.', true, now() - interval '1 day');
