/**
 * Abonnement : Gratuit, Essai, Premium.
 * La durée d'essai et l'accès aux fonctionnalités sont de la pure configuration :
 * on peut les changer sans toucher au reste de l'application.
 */
export type FeatureKey = 
/** Choisir entre plusieurs stratégies de rattrapage (Douce, Intense). */
'recovery.strategies'
/** Personnaliser la durée d'un plan. */
 | 'recovery.custom'
/** Protéger les jours spéciaux des réductions. */
 | 'recovery.protectSpecialDays'
/** Comparer plusieurs scénarios de simulation. */
 | 'simulation.scenarios'
/** Projections détaillées jour par jour. */
 | 'simulation.projections';
export type FeatureAccess = 'free' | 'premium';
export interface SubscriptionConfig {
    /** Durée de l'essai proposée aux nouveaux utilisateurs, en jours. */
    trialDurationDays: number;
    features: Record<FeatureKey, FeatureAccess>;
}
export declare const ALLOWED_TRIAL_DURATIONS: readonly [7, 14, 30];
export declare const DEFAULT_SUBSCRIPTION_CONFIG: SubscriptionConfig;
export interface SubscriptionRecord {
    /** Date ISO d'activation du Premium, ou null. */
    premiumSince: string | null;
    /** Date ISO de début d'essai, ou null si jamais utilisé. */
    trialStartedAt: string | null;
    /** Durée figée au démarrage de l'essai. */
    trialDurationDays: number | null;
}
export type SubscriptionTier = 'free' | 'trial' | 'premium';
export interface SubscriptionView {
    tier: SubscriptionTier;
    /** Accès aux fonctionnalités Premium (essai actif ou Premium). */
    hasPremiumAccess: boolean;
    trial: {
        /** L'essai n'a jamais été utilisé et peut être lancé. */
        available: boolean;
        active: boolean;
        expired: boolean;
        startedAt: string | null;
        endsAt: string | null;
        daysLeft: number;
        durationDays: number;
    };
    features: Record<FeatureKey, boolean>;
}
export declare function resolveSubscription(config: SubscriptionConfig, record: SubscriptionRecord, now: Date | string): SubscriptionView;
