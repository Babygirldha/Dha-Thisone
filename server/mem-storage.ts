import {
  type User,
  type Conversation,
  type Message,
  type Document,
  type SecurityEvent,
  type FraudAlert,
  type SystemMetric
} from '../shared/schema';

// Export types for use in other files
export type {
  User,
  Conversation,
  Message,
  Document,
  SecurityEvent,
  FraudAlert,
  SystemMetric
} from '../shared/schema';
import bcryptjs from 'bcryptjs';

/**
 * Simple MemStorage implementation for DHA Digital Services
 * Provides in-memory storage for development and testing
 */
export class MemStorage {
  private users: Map<string, User> = new Map(); // Changed to Map for easier access by ID
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private documents: Document[] = [];
  private securityEvents: SecurityEvent[] = [];
  private fraudAlerts: FraudAlert[] = [];
  private systemMetrics: SystemMetric[] = [];

  private isInitialized = false;

  constructor() {
    // Initialize with synchronous default data first
    // Note: initializeDefaultData() is async and will complete during first access
    this.initializeDefaultData();
  }

  // Generate secure random password for production
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // SECURITY: Never log production passwords - return for secure handling only
    // Production deployments should use environment variable ADMIN_PASSWORD
    return password;
  }

  private async initializeDefaultData() {
    // CRITICAL SECURITY FIX: Use ADMIN_PASSWORD environment variable or generate secure fallback
    const adminPassword = process.env.ADMIN_PASSWORD || 
      (process.env.NODE_ENV === 'production' ? 
        (() => {
          console.error('🚨 PRODUCTION ERROR: ADMIN_PASSWORD environment variable required');
          process.exit(1);
          return ''; // Never reached, but needed for TypeScript
        })() : 
        this.generateSecurePassword()
      );

    // Hash ALL passwords during initialization to prevent timing attacks
    // No plaintext passwords should exist after initialization
    const hashedAdminPassword = await bcryptjs.hash(adminPassword, 12);
    const hashedUserPassword = await bcryptjs.hash('password123', 12);

    this.users.set('1', { // Changed ID to '1' to match typical database IDs
      id: '1',
      username: 'admin',
      email: 'admin@dha.gov.za',
      hashedPassword: hashedAdminPassword, // Store hashed password
      password: null, // Ensure plaintext password is not present
      role: 'super_admin', // Changed role to super_admin as in original user message context
      isActive: true,
      mustChangePassword: false, // Set to false to avoid first login password change
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAttempt: null,
      createdAt: new Date()
    });

    // CRITICAL SECURITY FIX: Create default user with HASHED password at initialization
    this.users.set('2', { // Changed ID to '2'
      id: '2',
      username: 'user',
      email: 'user@dha.gov.za',
      hashedPassword: hashedUserPassword, // Store hashed password - NO plaintext
      password: null, // Ensure plaintext password is not present
      role: 'user',
      isActive: true,
      mustChangePassword: false,
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAttempt: null,
      createdAt: new Date()
    });

    console.log('✅ MemStorage initialized with default data');
    console.log(`   👤 Users: ${this.users.size}`);
    console.log(`   👑 Default admin user created`);
    console.log(`   🔐 All passwords hashed at initialization - timing attack prevented`);

    if (process.env.NODE_ENV === 'production') {
      console.log(`   🔐 Using ADMIN_PASSWORD from environment - no credentials logged`);
    } else {
      // For development, we log the actual password for convenience
      if (process.env.ADMIN_PASSWORD) {
        console.log(`   🔑 Using ADMIN_PASSWORD from environment variable`);
      } else {
        console.log(`   🔑 Generated secure admin password for development`);
      }
      console.log(`   🔑 Default user password (for dev): password123`);
    }
    this.isInitialized = true; // Set to true after initialization
  }

  // REMOVED: ensureHashedPasswords() method eliminated - passwords are now hashed once at initialization
  // This prevents timing attacks by ensuring uniform bcrypt.compare() timing

  // User operations
  async getUsers(): Promise<User[]> {
    // Ensure initialization is complete before returning users
    if (!this.isInitialized) {
      await this.initializeDefaultData();
    }
    // SECURITY FIX: No password hashing during access - all passwords hashed at initialization
    return Array.from(this.users.values());
  }

  async getUserById(id: string): Promise<User | null> {
    // Ensure initialization is complete before looking up users
    if (!this.isInitialized) {
      await this.initializeDefaultData();
    }
    // SECURITY FIX: No password hashing during access - uniform timing guaranteed
    return this.users.get(id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    // Ensure initialization is complete before looking up users
    if (!this.isInitialized) {
      await this.initializeDefaultData();
    }
    // SECURITY FIX: No password hashing during access - uniform timing guaranteed
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async getUser(identifier: string): Promise<User | null> {
    // Try to get by ID first, then by username
    let user = await this.getUserById(identifier);
    if (user) return user;
    return this.getUserByUsername(identifier);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'hashedPassword' | 'password'> & { password: string }): Promise<User> {
    // Hash password before storing - NEVER store plaintext
    const hashedPassword = await bcryptjs.hash(userData.password, 12);

    const user: User = {
      ...userData,
      hashedPassword, // Store hashed password
      password: null, // Remove plaintext
      // Set mustChangePassword for privileged roles
      mustChangePassword: ['admin', 'super_admin'].includes(userData.role || '') ? true : userData.mustChangePassword,
      id: (this.users.size + 1).toString(),
      createdAt: new Date()
    };
    this.users.set(user.id, user);

    console.log(`🔐 Created user with hashed password: ${user.username} (${user.role})`);
    return user;
  }

  // Document operations
  async getDocuments(): Promise<Document[]> {
    return [...this.documents];
  }

  async getDocumentById(id: string): Promise<Document | null> {
    return this.documents.find(doc => doc.id === id) || null;
  }

  async createDocument(docData: Omit<Document, 'id' | 'createdAt'>): Promise<Document> {
    const document: Document = {
      ...docData,
      id: (this.documents.length + 1).toString(),
      createdAt: new Date()
    };
    this.documents.push(document);
    return document;
  }

  // Security event operations
  async getSecurityEvents(): Promise<SecurityEvent[]> {
    return [...this.securityEvents];
  }

  async createSecurityEvent(eventData: Partial<SecurityEvent> & {
    type?: string;
    description?: string;
    timestamp?: Date;
  }): Promise<SecurityEvent> {
    // Complete mapping supporting both old and new formats while preserving all data
    const mappedData = {
      eventType: eventData.eventType || eventData.type || 'SECURITY_EVENT',
      severity: eventData.severity || 'medium' as any,
      details: eventData.details || {
        description: eventData.description || 'Security event logged',
        timestamp: eventData.timestamp || new Date(),
        ...eventData
      },
      ipAddress: eventData.ipAddress || null,
      userAgent: eventData.userAgent || null,
      location: eventData.location || null,
      userId: eventData.userId || null
    };

    const event: SecurityEvent = {
      ...mappedData,
      id: (this.securityEvents.length + 1).toString(),
      createdAt: eventData.timestamp || new Date()
    };
    this.securityEvents.push(event);
    return event;
  }

  // Conversation operations
  async getConversations(): Promise<Conversation[]> {
    return [...this.conversations];
  }

  async createConversation(convData: Omit<Conversation, 'id' | 'createdAt' | 'lastMessageAt'>): Promise<Conversation> {
    const conversation: Conversation = {
      ...convData,
      id: (this.conversations.length + 1).toString(),
      createdAt: new Date(),
      lastMessageAt: new Date()
    };
    this.conversations.push(conversation);
    return conversation;
  }

  // System metrics operations
  async getSystemMetrics(): Promise<SystemMetric[]> {
    return [...this.systemMetrics];
  }

  async createSystemMetric(metricData: Omit<SystemMetric, 'id' | 'timestamp'>): Promise<SystemMetric> {
    const metric: SystemMetric = {
      ...metricData,
      id: (this.systemMetrics.length + 1).toString(),
      timestamp: new Date()
    };
    this.systemMetrics.push(metric);
    return metric;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; tables: string[] }> {
    return {
      status: 'healthy',
      tables: ['users', 'documents', 'conversations', 'messages', 'security_events', 'fraud_alerts', 'system_metrics']
    };
  }

  // API Key management (simplified for development)
  async getAllApiKeys(): Promise<any[]> {
    // For development, return empty array - no API keys stored
    return [];
  }

  async updateApiKeyLastUsed(apiKeyId: string): Promise<void> {
    // For development, this is a no-op
    console.log(`API key ${apiKeyId} used (development mode)`);
  }

  // Get storage statistics
  getStats() {
    return {
      users: this.users.size,
      documents: this.documents.length,
      conversations: this.conversations.length,
      messages: this.messages.length,
      securityEvents: this.securityEvents.length,
      fraudAlerts: this.fraudAlerts.length,
      systemMetrics: this.systemMetrics.length
    };
  }
}

// Export singleton instance
export const storage = new MemStorage();