import { Secret } from '@/types/secret';

export const generateMockSecrets = (): Secret[] => [
  {
    id: '1',
    name: 'MongoDB Connection String',
    identifier: 'MONGODB_URI',
    value: 'mongodb+srv://user:password@cluster.mongodb.net/taktix?retryWrites=true&w=majority',
    project: {
      name: 'Taktix Backend',
      module: 'Database'
    },
    environment: 'production',
    meta: {
      description: 'Main MongoDB Atlas connection string for production database',
      tags: ['database', 'mongodb', 'atlas'],
      createdAt: new Date('2024-01-15'),
      lastUpdated: new Date('2024-02-01'),
      isActive: true
    }
  },
  {
    id: '2',
    name: 'JWT Secret Key',
    identifier: 'JWT_SECRET',
    value: 'super-secret-jwt-key-that-should-be-random-and-long-enough-for-security',
    project: {
      name: 'Taktix Backend',
      module: 'Authentication'
    },
    environment: 'production',
    meta: {
      description: 'Secret key used for signing and verifying JWT tokens',
      tags: ['auth', 'jwt', 'security'],
      createdAt: new Date('2024-01-10'),
      lastUpdated: new Date('2024-01-28'),
      isActive: true
    }
  },
  {
    id: '3',
    name: 'Stripe API Key',
    identifier: 'STRIPE_SECRET_KEY',
    value: 'sk_live_51234567890abcdefghijklmnopqrstuvwxyz',
    project: {
      name: 'E-commerce API',
      module: 'Payments'
    },
    environment: 'production',
    meta: {
      description: 'Stripe secret key for processing live payments',
      tags: ['payment', 'stripe', 'api'],
      createdAt: new Date('2024-01-20'),
      lastUpdated: new Date('2024-02-05'),
      isActive: true
    }
  },
  {
    id: '4',
    name: 'SendGrid API Key',
    identifier: 'SENDGRID_API_KEY',
    value: 'SG.1234567890abcdefghijklmnopqrstuvwxyz',
    project: {
      name: 'E-commerce API',
      module: 'Email Service'
    },
    environment: 'production',
    meta: {
      description: 'SendGrid API key for transactional emails',
      tags: ['email', 'sendgrid', 'api'],
      createdAt: new Date('2024-01-18'),
      lastUpdated: new Date('2024-01-30'),
      isActive: true
    }
  },
  {
    id: '5',
    name: 'Development Database URL',
    identifier: 'DATABASE_URL',
    value: 'postgresql://localhost:5432/taktix_dev',
    project: {
      name: 'Taktix Backend',
      module: 'Database'
    },
    environment: 'development',
    meta: {
      description: 'Local PostgreSQL database for development',
      tags: ['database', 'postgresql', 'local'],
      createdAt: new Date('2024-01-05'),
      lastUpdated: new Date('2024-01-25'),
      isActive: true
    }
  },
  {
    id: '6',
    name: 'Redis Session Store',
    identifier: 'REDIS_URL',
    value: 'redis://localhost:6379',
    project: {
      name: 'Portfolio Site',
      module: 'Session Management'
    },
    environment: 'development',
    meta: {
      description: 'Redis instance for session storage and caching',
      tags: ['redis', 'session', 'cache'],
      createdAt: new Date('2024-01-12'),
      lastUpdated: new Date('2024-02-02'),
      isActive: true
    }
  },
  {
    id: '7',
    name: 'Testing Stripe Key',
    identifier: 'STRIPE_TEST_KEY',
    value: 'sk_test_51234567890abcdefghijklmnopqrstuvwxyz',
    project: {
      name: 'E-commerce API',
      module: 'Payments'
    },
    environment: 'testing',
    meta: {
      description: 'Stripe test key for payment integration testing',
      tags: ['payment', 'stripe', 'testing'],
      createdAt: new Date('2024-01-22'),
      lastUpdated: new Date('2024-02-03'),
      isActive: true
    }
  },
  {
    id: '8',
    name: 'Firebase Admin SDK',
    identifier: 'FIREBASE_ADMIN_KEY',
    value: '{"type":"service_account","project_id":"mobile-app-backend","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"}',
    project: {
      name: 'Mobile App Backend',
      module: 'Push Notifications'
    },
    environment: 'production',
    meta: {
      description: 'Firebase admin SDK credentials for push notifications',
      tags: ['firebase', 'push', 'mobile'],
      createdAt: new Date('2024-01-25'),
      lastUpdated: new Date('2024-02-06'),
      isActive: true
    }
  },
  {
    id: '9',
    name: 'AWS S3 Access Key',
    identifier: 'AWS_ACCESS_KEY_ID',
    value: 'AKIA1234567890ABCDEF',
    project: {
      name: 'Portfolio Site',
      module: 'File Upload'
    },
    environment: 'staging',
    meta: {
      description: 'AWS access key for S3 file uploads in staging',
      tags: ['aws', 's3', 'storage'],
      createdAt: new Date('2024-01-08'),
      lastUpdated: new Date('2024-01-29'),
      isActive: false
    }
  },
  {
    id: '10',
    name: 'OAuth Google Client Secret',
    identifier: 'GOOGLE_CLIENT_SECRET',
    value: 'GOCSPX-1234567890abcdefghijklmnopqrstuv',
    project: {
      name: 'Mobile App Backend',
      module: 'Authentication'
    },
    environment: 'production',
    meta: {
      description: 'Google OAuth client secret for social authentication',
      tags: ['oauth', 'google', 'auth'],
      createdAt: new Date('2024-01-14'),
      lastUpdated: new Date('2024-02-04'),
      isActive: true
    }
  }
];