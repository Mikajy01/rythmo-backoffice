/**
 * Contrats du back-office et de l'offre d'abonnement.
 * Partagés entre l'API et les applications (back-office, web, mobile) : seuls des types et
 * quelques constantes, aucune logique.
 */
import type { FeatureAccess, FeatureKey, SubscriptionTier } from './subscription';
export declare const ADMIN_ROLES: readonly ["owner", "manager", "support", "analyst"];
export type AdminRole = (typeof ADMIN_ROLES)[number];
export declare const ADMIN_PERMISSIONS: readonly ["dashboard:read", "users:read", "users:write", "users:delete", "pricing:read", "pricing:write", "promotions:read", "promotions:write", "audit:read", "admins:manage"];
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
/** Qui peut faire quoi. Modifier cette table suffit à changer les droits d'un rôle. */
export declare const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]>;
export declare const ROLE_LABELS: Record<AdminRole, string>;
export interface AdminProfile {
    id: string;
    email: string;
    displayName: string;
    role: AdminRole;
    permissions: AdminPermission[];
}
export interface AdminSession {
    token: string;
    admin: AdminProfile;
}
export interface AdminAccountView extends AdminProfile {
    active: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}
export interface Paginated<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
export type PlanInterval = 'month' | 'year';
export interface PlanView {
    id: string;
    code: string;
    name: string;
    description: string;
    interval: PlanInterval;
    /** Prix dans la plus petite unité de la devise. */
    amount: number;
    currency: string;
    active: boolean;
    sortOrder: number;
    /** Abonnements actifs sur cette offre. */
    subscribers: number;
    createdAt: string;
    updatedAt: string;
}
export type PromotionKind = 'percent' | 'fixed' | 'free_trial';
export type PromotionStatus = 'scheduled' | 'active' | 'paused' | 'expired' | 'exhausted';
export interface PromotionView {
    id: string;
    code: string;
    name: string;
    description: string;
    kind: PromotionKind;
    /** Pourcentage (1–100), montant retiré, ou nombre de jours d'essai offerts. */
    value: number;
    /** Vide = toutes les offres. */
    planCodes: string[];
    startsAt: string | null;
    endsAt: string | null;
    maxRedemptions: number | null;
    redemptions: number;
    active: boolean;
    status: PromotionStatus;
    createdAt: string;
}
export interface SubscriptionSettingsView {
    trialDurationDays: number;
    allowedTrialDurations: number[];
    features: Record<FeatureKey, FeatureAccess>;
}
export interface OfferPlanView {
    code: string;
    name: string;
    description: string;
    interval: PlanInterval;
    amount: number;
    currency: string;
}
export interface OfferView {
    trialDurationDays: number;
    plans: OfferPlanView[];
}
export interface PromoQuoteView {
    promoCode: string;
    promoName: string;
    kind: PromotionKind;
    planCode: string;
    listAmount: number;
    amountDue: number;
    discount: number;
    /** Jours d'essai offerts (promotion « free_trial »), sinon 0. */
    trialDays: number;
    currency: string;
}
export interface AdminUserListItem {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
    lastSeenAt: string | null;
    onboarded: boolean;
    currency: string;
    tier: SubscriptionTier;
    suspended: boolean;
}
export interface SubscriptionRecordView {
    id: string;
    planCode: string;
    planName: string;
    interval: PlanInterval;
    currency: string;
    listAmount: number;
    amountPaid: number;
    promoCode: string | null;
    source: 'app' | 'admin';
    status: 'active' | 'cancelled';
    startedAt: string;
    cancelledAt: string | null;
    note: string | null;
}
export interface AdminUserDetail extends AdminUserListItem {
    monthlyBudget: number;
    periodStartDay: number;
    suspendedAt: string | null;
    trial: {
        startedAt: string | null;
        durationDays: number | null;
        endsAt: string | null;
        active: boolean;
    };
    premiumSince: string | null;
    stats: {
        expenses: number;
        expensesTotal: number;
        recoveryPlans: number;
        achievements: number;
        notifications: number;
        activeDays30: number;
    };
    subscriptions: SubscriptionRecordView[];
}
export interface SeriesPoint {
    date: string;
    value: number;
}
export interface DashboardOverview {
    generatedAt: string;
    rangeDays: number;
    /** Devise des montants affichés (revenus, MRR). */
    currency: string;
    kpis: {
        totalUsers: number;
        newUsers: number;
        newUsersPrevious: number;
        activeUsers: number;
        activeToday: number;
        onboardedRate: number;
        premiumUsers: number;
        trialUsers: number;
        freeUsers: number;
        suspendedUsers: number;
        /** Part des comptes en Premium. */
        conversionRate: number;
        /** Revenu mensuel récurrent : abonnements actifs ramenés au mois. */
        mrr: number;
        revenue: number;
        revenuePrevious: number;
        cancellations: number;
        expensesCount: number;
    };
    series: {
        signups: SeriesPoint[];
        activeUsers: SeriesPoint[];
        revenue: SeriesPoint[];
        expenses: SeriesPoint[];
    };
    tiers: {
        tier: SubscriptionTier;
        count: number;
    }[];
    plans: {
        code: string;
        name: string;
        subscribers: number;
        mrr: number;
    }[];
    promotions: {
        code: string;
        name: string;
        redemptions: number;
        discountGiven: number;
    }[];
    categories: {
        categoryId: string;
        count: number;
    }[];
    recentSignups: AdminUserListItem[];
}
export interface AuditEntryView {
    id: string;
    adminEmail: string;
    action: string;
    targetType: string;
    targetId: string | null;
    summary: string;
    metadata: unknown;
    createdAt: string;
}
