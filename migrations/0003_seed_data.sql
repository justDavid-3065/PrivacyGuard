
-- Seed data for development and testing

-- Insert test users (only if they don't exist)
INSERT INTO users (id, email, first_name, last_name, role) VALUES
  ('test-user-1', 'admin@privacyguard.com', 'Admin', 'User', 'owner'),
  ('test-user-2', 'manager@privacyguard.com', 'Manager', 'User', 'admin'),
  ('test-user-3', 'viewer@privacyguard.com', 'Viewer', 'User', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample data types
INSERT INTO data_types (name, description, category, purpose, source, retention, legal_basis, user_id) VALUES
  ('Email Address', 'User email addresses for communication', 'personal', 'Account creation and communication', 'Registration form', '7 years', 'Contract', 'test-user-1'),
  ('Payment Information', 'Credit card and billing details', 'financial', 'Payment processing', 'Checkout form', '7 years', 'Contract', 'test-user-1'),
  ('Usage Analytics', 'Website usage and behavior data', 'analytics', 'Service improvement', 'Website cookies', '2 years', 'Legitimate Interest', 'test-user-1')
ON CONFLICT DO NOTHING;

-- Insert sample consent records
INSERT INTO consent_records (subject_email, subject_name, consent_type, status, policy_version, method, user_id) VALUES
  ('john.doe@example.com', 'John Doe', 'marketing', 'granted', 'v1.0', 'website', 'test-user-1'),
  ('jane.smith@example.com', 'Jane Smith', 'analytics', 'granted', 'v1.0', 'website', 'test-user-1'),
  ('bob.johnson@example.com', 'Bob Johnson', 'marketing', 'withdrawn', 'v1.0', 'email', 'test-user-1')
ON CONFLICT DO NOTHING;

-- Insert sample DSAR requests
INSERT INTO dsar_requests (subject_email, subject_name, request_type, description, due_date, user_id) VALUES
  ('john.doe@example.com', 'John Doe', 'access', 'Request for personal data access', NOW() + INTERVAL '30 days', 'test-user-1'),
  ('jane.smith@example.com', 'Jane Smith', 'deletion', 'Request for data deletion', NOW() + INTERVAL '30 days', 'test-user-1')
ON CONFLICT DO NOTHING;

-- Insert sample privacy notice
INSERT INTO privacy_notices (title, content, version, regulation, is_active, effective_date, user_id) VALUES
  ('Privacy Policy', 'This is our comprehensive privacy policy...', 'v1.0', 'GDPR', true, NOW(), 'test-user-1')
ON CONFLICT DO NOTHING;

-- Insert sample domains
INSERT INTO domains (name, user_id) VALUES
  ('example.com', 'test-user-1'),
  ('test-domain.com', 'test-user-1')
ON CONFLICT (name) DO NOTHING;
