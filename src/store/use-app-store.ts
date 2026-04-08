"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { loadMockData } from "@/lib/mock-data-loader";
import type { MockDataBundle, RoleKey, User } from "@/types/mock-data";

export type AppScreenState =
  | "loading"
  | "entry"
  | "explore"
  | "auth_login"
  | "auth_otp"
  | "dashboard"
  | "lot_detail"
  | "contract_detail"
  | "admin_decoder"
  | "rfq_list"
  | "rfq_detail"
  | "offer_detail"
  | "bank_review"
  | "lab_result"
  | "trade_ready";

export interface SessionSlice {
  session: {
    userId: string | null;
    linkedActorId: string | null;
    primaryRole: RoleKey | null;
    roleIds: string[];
    permissions: string[];
    organizationId: string | null;
    authenticated: boolean;
  };
  authenticated: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  linkedActorId: string | null;
  primaryRole: RoleKey | null;
  role: RoleKey | null;
  roleIds: string[];
  permissions: string[];
  organizationId: string | null;
  pendingLoginUserId: string | null;
  loginAs: (user: User, data: MockDataBundle) => void;
  attemptLogin: (identifier: string, password: string) => { ok: boolean; message?: string };
  verifyOtp: (otp: string) => { ok: boolean; message?: string };
  setPendingLoginUser: (userId: string | null) => void;
  logout: () => void;
}

export interface AppSlice {
  appName: string;
  environment: string;
}

export interface MockDataSlice {
  data: MockDataBundle | null;
  loadAllMockData: () => void;
  createMockPickEvent: (farmId: string, weightKg: number) => { ok: boolean; message: string };
  validatePendingLot: (lotId: string, confirmedWeightKg: number) => { ok: boolean; message: string };
  processLotWithLosses: (
    lotId: string,
    outputWeightKg: number,
    losses: { type: string; weightKg: number }[],
  ) => {
    ok: boolean;
    message: string;
    massBalance?: { input: number; output: number; typedLossTotal: number; variance: number };
  };
  acceptTransportCustody: (lotId: string) => { ok: boolean; message: string };
}

export interface UiSlice {
  stageLabel: string;
  currentState: AppScreenState;
  currentStateLabel: string;
  primaryActionLabel: string;
  selectedListingId: string | null;
  selectedListingType: "rfq" | "auction" | "offer" | null;
  selectedLotId: string | null;
  selectedRfqId: string | null;
  selectedOfferId: string | null;
  selectedContractId: string | null;
  selectedBankApprovalId: string | null;
  selectedLabResultId: string | null;
  lastOperationMessage: string | null;
  lastMassBalance:
    | { input: number; output: number; typedLossTotal: number; variance: number }
    | null;
  isHydrating: boolean;
  goToState: (state: AppScreenState) => void;
  openListingExplore: (listingType: "rfq" | "auction" | "offer", listingId: string) => void;
  openLotDetail: (lotId: string) => void;
  startTradeFlow: () => void;
  openRfqDetail: (rfqId: string) => void;
  openOfferDetail: (offerId: string) => void;
  openContractDetail: (contractId: string) => void;
  openBankReview: (bankApprovalId: string) => void;
  openLabResult: (labResultId: string) => void;
  setOperationResult: (
    message: string | null,
    massBalance?: { input: number; output: number; typedLossTotal: number; variance: number } | null,
  ) => void;
  advanceState: () => void;
  setHydrating: (isHydrating: boolean) => void;
}

export type AppStore = SessionSlice & AppSlice & MockDataSlice & UiSlice;

const stateMeta: Record<AppScreenState, { label: string; primaryAction: string }> = {
  loading: { label: "Loading", primaryAction: "Initializing..." },
  entry: { label: "Entry", primaryAction: "Continue" },
  explore: { label: "Explore", primaryAction: "Proceed to login" },
  auth_login: { label: "Auth Login", primaryAction: "Request OTP" },
  auth_otp: { label: "Auth OTP", primaryAction: "Verify OTP" },
  dashboard: { label: "Dashboard", primaryAction: "Open lot detail" },
  lot_detail: { label: "Lot Detail", primaryAction: "Open contract detail" },
  contract_detail: { label: "Contract Detail", primaryAction: "Open admin decoder" },
  admin_decoder: { label: "Admin Decoder", primaryAction: "Return to dashboard" },
  rfq_list: { label: "RFQ List", primaryAction: "Open RFQ" },
  rfq_detail: { label: "RFQ Detail", primaryAction: "Continue to offer" },
  offer_detail: { label: "Offer Detail", primaryAction: "Open linked lot" },
  bank_review: { label: "Bank Review", primaryAction: "Continue to lab result" },
  lab_result: { label: "Lab Result", primaryAction: "Continue to readiness" },
  trade_ready: { label: "Trade Ready", primaryAction: "Return to dashboard" },
};

const getInitialApp = () => {
  const data = loadMockData();
  return {
    appName: data.app.name,
    environment: data.app.environment,
  };
};

const initialApp = getInitialApp();

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      authenticated: false,
      isAuthenticated: false,
      session: {
        userId: null,
        linkedActorId: null,
        primaryRole: null,
        roleIds: [],
        permissions: [],
        organizationId: null,
        authenticated: false,
      },
      userId: null,
      linkedActorId: null,
      primaryRole: null,
      role: null,
      roleIds: [],
      permissions: [],
      organizationId: null,
      pendingLoginUserId: null,
      loginAs: (user, data) => {
        const permissions = data.roles
          .filter((r) => user.roleIds.includes(r.id))
          .flatMap((r) => r.permissions);
        set({
          session: {
            userId: user.id,
            linkedActorId: user.linkedActorId,
            primaryRole: user.primaryRole,
            roleIds: user.roleIds,
            permissions: [...new Set(permissions)],
            organizationId: user.organizationId,
            authenticated: true,
          },
          authenticated: true,
          isAuthenticated: true,
          userId: user.id,
          linkedActorId: user.linkedActorId,
          primaryRole: user.primaryRole,
          role: user.primaryRole,
          roleIds: user.roleIds,
          permissions: [...new Set(permissions)],
          organizationId: user.organizationId,
          pendingLoginUserId: null,
          currentState: "dashboard",
          currentStateLabel: stateMeta.dashboard.label,
          primaryActionLabel: stateMeta.dashboard.primaryAction,
        });
      },
      attemptLogin: (identifier, password) => {
        const data = get().data;
        if (!data) return { ok: false, message: "Mock data not loaded." };
        const cleanId = identifier.trim().toLowerCase();
        const user = data.users.find(
          (u) => u.email.toLowerCase() === cleanId || u.phone.toLowerCase() === cleanId,
        );
        if (!user) return { ok: false, message: "User not found." };
        if (user.password !== password) return { ok: false, message: "Invalid password." };
        set({
          pendingLoginUserId: user.id,
          currentState: "auth_otp",
          currentStateLabel: stateMeta.auth_otp.label,
          primaryActionLabel: stateMeta.auth_otp.primaryAction,
        });
        return { ok: true };
      },
      verifyOtp: (otp) => {
        const data = get().data;
        const pendingLoginUserId = get().pendingLoginUserId;
        if (!data || !pendingLoginUserId) {
          return { ok: false, message: "No active login request." };
        }
        if (!/^\d{6}$/.test(otp)) {
          return { ok: false, message: "OTP must be 6 digits." };
        }
        const user = data.users.find((u) => u.id === pendingLoginUserId);
        if (!user) return { ok: false, message: "Pending user missing." };
        if (otp !== user.defaultOtp) return { ok: false, message: "Invalid OTP." };
        get().loginAs(user, data);
        return { ok: true };
      },
      setPendingLoginUser: (userId) => set({ pendingLoginUserId: userId }),
      logout: () =>
        set({
          session: {
            userId: null,
            linkedActorId: null,
            primaryRole: null,
            roleIds: [],
            permissions: [],
            organizationId: null,
            authenticated: false,
          },
          authenticated: false,
          isAuthenticated: false,
          userId: null,
          linkedActorId: null,
          primaryRole: null,
          role: null,
          roleIds: [],
          permissions: [],
          organizationId: null,
          pendingLoginUserId: null,
          selectedListingId: null,
          selectedListingType: null,
          selectedLotId: null,
          selectedRfqId: null,
          selectedOfferId: null,
          selectedContractId: null,
          selectedBankApprovalId: null,
          selectedLabResultId: null,
          lastOperationMessage: null,
          lastMassBalance: null,
          currentState: "auth_login",
          currentStateLabel: stateMeta.auth_login.label,
          primaryActionLabel: stateMeta.auth_login.primaryAction,
        }),

      appName: initialApp.appName,
      environment: initialApp.environment,

      data: null,
      loadAllMockData: () => {
        set({ isHydrating: true });
        const data = loadMockData();
        const isAuthenticated = get().authenticated;
        set({
          data,
          appName: data.app.name,
          environment: data.app.environment,
          currentState: isAuthenticated ? "dashboard" : "auth_login",
          currentStateLabel: isAuthenticated
            ? stateMeta.dashboard.label
            : stateMeta.auth_login.label,
          primaryActionLabel: isAuthenticated
            ? stateMeta.dashboard.primaryAction
            : stateMeta.auth_login.primaryAction,
          isHydrating: false,
        });
      },
      createMockPickEvent: (farmId, weightKg) => {
        if (weightKg <= 0) return { ok: false, message: "Weight must be greater than zero." };
        const data = get().data;
        const userId = get().userId;
        if (!data || !userId) return { ok: false, message: "No active session." };
        const user = data.users.find((item) => item.id === userId);
        if (!user) return { ok: false, message: "User not found." };
        const nextLotIndex = data.lots.length + 1;
        const lotId = `lot_${String(nextLotIndex).padStart(3, "0")}`;
        const eventId = `evt_${String(data.inventoryEvents.length + 1).padStart(3, "0")}`;
        const now = new Date().toISOString();
        const newLot = {
          id: lotId,
          internalUuid: `mock-${lotId}-${Date.now()}`,
          publicLotCode: `ETH-MOCK-${String(Date.now()).slice(-4)}-${String(nextLotIndex).padStart(3, "0")}`,
          traceKey: `TRC-MOCK-${String(nextLotIndex).padStart(3, "0")}`,
          commodity: "coffee",
          form: "cherry",
          sourceType: "farm_pick",
          farmId,
          originActorId: user.linkedActorId,
          currentOwnerActorId: user.linkedActorId,
          currentCustodianActorId: user.linkedActorId,
          facilityId: null,
          weightKg,
          status: "pending_validation",
          qualityGrade: null,
          parentLotIds: [],
          childLotIds: [],
          harvestDate: now,
          createdAt: now,
          geoInherited: true,
          integrityStatus: "provisional",
        };
        const newEvent = {
          id: eventId,
          type: "PICK",
          timestamp: now,
          lotId,
          actorId: user.linkedActorId,
          fromActorId: null,
          toActorId: user.linkedActorId,
          facilityId: null,
          weightKg,
          status: "recorded",
          verificationStatus: "provisional",
          notes: "Mock pick entry from operational flow",
        };
        set({
          data: {
            ...data,
            lots: [...data.lots, newLot],
            inventoryEvents: [...data.inventoryEvents, newEvent],
          },
          lastOperationMessage: `Pick recorded for ${lotId}.`,
          lastMassBalance: null,
        });
        return { ok: true, message: "Pick event created." };
      },
      validatePendingLot: (lotId, confirmedWeightKg) => {
        if (confirmedWeightKg <= 0) return { ok: false, message: "Confirmed weight must be positive." };
        const data = get().data;
        const userId = get().userId;
        if (!data || !userId) return { ok: false, message: "No active session." };
        const user = data.users.find((item) => item.id === userId);
        const targetLot = data.lots.find((lot) => lot.id === lotId);
        if (!user || !targetLot) return { ok: false, message: "Lot or user missing." };
        const varianceKg = Math.max(targetLot.weightKg - confirmedWeightKg, 0);
        const eventId = `evt_${String(data.inventoryEvents.length + 1).padStart(3, "0")}`;
        const updatedLots = data.lots.map((lot) =>
          lot.id === lotId
            ? { ...lot, weightKg: confirmedWeightKg, status: "in_stock", integrityStatus: "verified" }
            : lot,
        );
        const newEvent = {
          id: eventId,
          type: "VALIDATE_PICK",
          timestamp: new Date().toISOString(),
          lotId,
          actorId: user.linkedActorId,
          fromActorId: targetLot.originActorId,
          toActorId: user.linkedActorId,
          reportedWeightKg: targetLot.weightKg,
          confirmedWeightKg,
          varianceKg,
          status: "recorded",
          verificationStatus: "verified",
          notes: "Validated from Stage 6 operational flow",
        };
        set({
          data: { ...data, lots: updatedLots, inventoryEvents: [...data.inventoryEvents, newEvent] },
          lastOperationMessage: `Lot ${lotId} validated and verified.`,
          lastMassBalance: null,
        });
        return { ok: true, message: "Lot validated." };
      },
      processLotWithLosses: (lotId, outputWeightKg, losses) => {
        const data = get().data;
        const userId = get().userId;
        if (!data || !userId) return { ok: false, message: "No active session." };
        const user = data.users.find((item) => item.id === userId);
        const lot = data.lots.find((item) => item.id === lotId);
        if (!user || !lot) return { ok: false, message: "Lot or user missing." };
        if (outputWeightKg <= 0) return { ok: false, message: "Output weight must be positive." };
        if (!losses.length) return { ok: false, message: "At least one typed loss is required." };
        if (losses.some((loss) => loss.weightKg <= 0)) {
          return { ok: false, message: "Loss weights must be positive." };
        }
        if (losses.some((loss) => !loss.type.trim())) {
          return { ok: false, message: "Loss type is required." };
        }
        const input = lot.weightKg;
        const typedLossTotal = losses.reduce((sum, loss) => sum + loss.weightKg, 0);
        const variance = input - outputWeightKg - typedLossTotal;
        const eventId = `evt_${String(data.inventoryEvents.length + 1).padStart(3, "0")}`;
        const updatedLots = data.lots.map((item) =>
          item.id === lotId
            ? {
                ...item,
                form: "parchment",
                weightKg: outputWeightKg,
                status: "ready_for_export",
                integrityStatus: "verified",
              }
            : item,
        );
        const newEvent = {
          id: eventId,
          type: "PROCESS_PULP_AND_WASH",
          timestamp: new Date().toISOString(),
          lotId,
          parentLotIds: lot.parentLotIds,
          actorId: user.linkedActorId,
          facilityId: lot.facilityId,
          inputWeightKg: input,
          outputWeightKg,
          losses,
          varianceKg: variance,
          status: "recorded",
          verificationStatus: "verified",
          notes: "Processed from Stage 6 operational flow",
        };
        const massBalance = { input, output: outputWeightKg, typedLossTotal, variance };
        set({
          data: { ...data, lots: updatedLots, inventoryEvents: [...data.inventoryEvents, newEvent] },
          lastOperationMessage: `Processed ${lotId} with typed losses.`,
          lastMassBalance: massBalance,
        });
        return { ok: true, message: "Lot processed.", massBalance };
      },
      acceptTransportCustody: (lotId) => {
        const data = get().data;
        const userId = get().userId;
        if (!data || !userId) return { ok: false, message: "No active session." };
        const user = data.users.find((item) => item.id === userId);
        const lot = data.lots.find((item) => item.id === lotId);
        if (!user || !lot) return { ok: false, message: "Lot or user missing." };
        const eventId = `evt_${String(data.inventoryEvents.length + 1).padStart(3, "0")}`;
        const newEvent = {
          id: eventId,
          type: "TRANSFER_CUSTODY",
          timestamp: new Date().toISOString(),
          lotId,
          actorId: user.linkedActorId,
          fromActorId: lot.currentCustodianActorId,
          toActorId: user.linkedActorId,
          weightKg: lot.weightKg,
          status: "recorded",
          verificationStatus: "verified",
          notes: "Custody accepted from Stage 6 flow",
        };
        const updatedLots = data.lots.map((item) =>
          item.id === lotId ? { ...item, currentCustodianActorId: user.linkedActorId } : item,
        );
        set({
          data: { ...data, lots: updatedLots, inventoryEvents: [...data.inventoryEvents, newEvent] },
          lastOperationMessage: `Custody accepted for ${lotId}.`,
          lastMassBalance: null,
        });
        return { ok: true, message: "Custody accepted." };
      },

      stageLabel: "Stage 10 — MVP Hardening",
      currentState: "loading",
      currentStateLabel: stateMeta.loading.label,
      primaryActionLabel: stateMeta.loading.primaryAction,
      selectedListingId: null,
      selectedListingType: null,
      selectedLotId: null,
      selectedRfqId: null,
      selectedOfferId: null,
      selectedContractId: null,
      selectedBankApprovalId: null,
      selectedLabResultId: null,
      lastOperationMessage: null,
      lastMassBalance: null,
      isHydrating: true,
      goToState: (state) => {
        set({
          currentState: state,
          currentStateLabel: stateMeta[state].label,
          primaryActionLabel: stateMeta[state].primaryAction,
        });
      },
      openListingExplore: (listingType, listingId) => {
        set({
          selectedListingType: listingType,
          selectedListingId: listingId,
          selectedLotId: null,
          selectedRfqId: null,
          selectedOfferId: null,
          selectedContractId: null,
          selectedBankApprovalId: null,
          selectedLabResultId: null,
          currentState: "explore",
          currentStateLabel: stateMeta.explore.label,
          primaryActionLabel: stateMeta.explore.primaryAction,
        });
      },
      openLotDetail: (lotId) => {
        set({
          selectedLotId: lotId,
          selectedListingId: null,
          selectedListingType: null,
          currentState: "lot_detail",
          currentStateLabel: stateMeta.lot_detail.label,
          primaryActionLabel: stateMeta.lot_detail.primaryAction,
        });
      },
      startTradeFlow: () =>
        set({
          selectedListingId: null,
          selectedListingType: null,
          selectedRfqId: null,
          selectedOfferId: null,
          selectedContractId: null,
          selectedBankApprovalId: null,
          selectedLabResultId: null,
          currentState: "rfq_list",
          currentStateLabel: stateMeta.rfq_list.label,
          primaryActionLabel: stateMeta.rfq_list.primaryAction,
        }),
      openRfqDetail: (rfqId) =>
        set({
          selectedRfqId: rfqId,
          selectedOfferId: null,
          selectedContractId: null,
          selectedBankApprovalId: null,
          selectedLabResultId: null,
          currentState: "rfq_detail",
          currentStateLabel: stateMeta.rfq_detail.label,
          primaryActionLabel: stateMeta.rfq_detail.primaryAction,
        }),
      openOfferDetail: (offerId) =>
        set({
          selectedOfferId: offerId,
          selectedContractId: null,
          selectedBankApprovalId: null,
          selectedLabResultId: null,
          currentState: "offer_detail",
          currentStateLabel: stateMeta.offer_detail.label,
          primaryActionLabel: stateMeta.offer_detail.primaryAction,
        }),
      openContractDetail: (contractId) =>
        set({
          selectedContractId: contractId,
          selectedBankApprovalId: null,
          selectedLabResultId: null,
          currentState: "contract_detail",
          currentStateLabel: stateMeta.contract_detail.label,
          primaryActionLabel: stateMeta.contract_detail.primaryAction,
        }),
      openBankReview: (bankApprovalId) =>
        set({
          selectedBankApprovalId: bankApprovalId,
          currentState: "bank_review",
          currentStateLabel: stateMeta.bank_review.label,
          primaryActionLabel: stateMeta.bank_review.primaryAction,
        }),
      openLabResult: (labResultId) =>
        set({
          selectedLabResultId: labResultId,
          currentState: "lab_result",
          currentStateLabel: stateMeta.lab_result.label,
          primaryActionLabel: stateMeta.lab_result.primaryAction,
        }),
      setOperationResult: (message, massBalance = null) =>
        set({ lastOperationMessage: message, lastMassBalance: massBalance }),
      advanceState: () => {
        const { currentState, isAuthenticated } = get();
        if (currentState === "loading") return set({ isHydrating: false });
        if (currentState === "entry") return get().goToState("explore");
        if (currentState === "explore") return get().goToState("auth_login");
        if (currentState === "auth_login") return get().goToState("auth_otp");
        if (currentState === "auth_otp") return get().goToState("dashboard");
        if (currentState === "dashboard") return get().goToState("lot_detail");
        if (currentState === "lot_detail") return get().goToState("contract_detail");
        if (currentState === "contract_detail") return get().goToState("admin_decoder");
        if (currentState === "admin_decoder") {
          return get().goToState(isAuthenticated ? "dashboard" : "auth_login");
        }
      },
      setHydrating: (isHydrating) => set({ isHydrating }),
    }),
    {
      name: "ankuaru-session-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        authenticated: state.authenticated,
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        linkedActorId: state.linkedActorId,
        primaryRole: state.primaryRole,
        role: state.role,
        roleIds: state.roleIds,
        permissions: state.permissions,
        organizationId: state.organizationId,
        pendingLoginUserId: state.pendingLoginUserId,
      }),
    },
  ),
);
