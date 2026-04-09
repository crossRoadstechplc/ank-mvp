"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { archiveEntity, createEntity, lotHasLineageLinks, updateEntity } from "@/lib/crud/entity-crud";
import { hasFinalLabOutcomeForLot, isLabIntakeLot } from "@/lib/lab-flow";
import { isSupportedEventType } from "@/lib/inventory-events";
import { loadMockData } from "@/lib/mock-data-loader";
import {
  cloneLiveFromSeed,
  clearLiveStorage,
  mergeLiveWithSeed,
  readLiveDataFromApi,
  readLiveDataFromStorage,
  writeLiveDataToApi,
  writeLiveDataToStorage,
} from "@/lib/live-data";
import { getRuntimeSessionStorageKey } from "@/lib/runtime-scope";
import {
  isoNow,
  newContractUid,
  newFarmUid,
  newInternalUuid,
  newPublicLotCode,
  newRfqUid,
  newTraceKey,
  nextPrefixedId,
} from "@/lib/ids";
import type { AppScreenState } from "@/store/state-meta";
import { stateMeta } from "@/store/state-meta";
import type {
  BankApproval,
  Farm,
  InventoryEvent,
  LabResult,
  LiveDataBundle,
  Lot,
  LotCodeMapItem,
  MockDataBundle,
  Offer,
  Rfq,
  RoleKey,
  User,
} from "@/types/mock-data";

export type { AppScreenState };

function hasPermission(get: () => AppStore, key: string): boolean {
  return get().permissions.includes(key);
}

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
  loginAs: (user: User) => void;
  attemptLogin: (identifier: string, password: string) => { ok: boolean; message?: string };
  verifyOtp: (otp: string) => { ok: boolean; message?: string };
  setPendingLoginUser: (userId: string | null) => void;
  logout: () => void;
}

export interface AppSlice {
  appName: string;
  environment: string;
}

export interface DataSlice {
  seedData: MockDataBundle | null;
  liveData: LiveDataBundle | null;
  data: MockDataBundle | null;
  loadAllMockData: () => void;
  resetLiveDataToSeed: () => void;
  exportLiveDataSnapshot: () => string;
  clearLocalState: () => void;
  hydrateLiveData: () => void;
  createMockPickEvent: (
    farmId: string,
    weightKg: number,
  ) => { ok: boolean; message: string; lotId?: string };
  createFarmerLot: (
    farmId: string,
    weightKg: number,
  ) => { ok: boolean; message: string; lotId?: string };
  updateProvisionalLot: (lotId: string, patch: { weightKg?: number; notes?: string }) => {
    ok: boolean;
    message: string;
  };
  archiveFarmerLot: (lotId: string) => { ok: boolean; message: string };
  createFarmField: (input: Omit<Farm, "id" | "uid"> & { uid?: string }) => { ok: boolean; message: string; farm?: Farm };
  updateFarmField: (farmId: string, patch: Partial<Farm>) => { ok: boolean; message: string };
  archiveFarmField: (farmId: string) => { ok: boolean; message: string };
  validatePendingLot: (lotId: string, confirmedWeightKg: number) => { ok: boolean; message: string };
  receiveLotAsAggregator: (lotId: string, notes?: string) => { ok: boolean; message: string };
  createAggregatedLot: (parentLotIds: string[], weightKg: number, notes?: string) => {
    ok: boolean;
    message: string;
    lotId?: string;
  };
  processLotWithLosses: (
    lotId: string,
    outputWeightKg: number,
    losses: { type: string; weightKg: number }[],
    opts?: {
      qualityGrade?: string | null;
      notes?: string;
      facilityId?: string | null;
      processType?: "PROCESS_PULP_AND_WASH" | "PROCESS_HULL_AND_GRADE";
    },
  ) => {
    ok: boolean;
    message: string;
    massBalance?: { input: number; output: number; typedLossTotal: number; variance: number };
    outputLotId?: string;
  };
  acceptTransportCustody: (lotId: string) => { ok: boolean; message: string };
  handoverCustodyToLab: (lotId: string) => { ok: boolean; message: string };
  appendInventoryEvent: (
    event: Omit<InventoryEvent, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"> & {
      id?: string;
    },
  ) => { ok: boolean; message: string };
  quarantineLot: (lotId: string, reason?: string) => { ok: boolean; message: string };
  releaseLotQuarantine: (lotId: string) => { ok: boolean; message: string };
  createImporterRfq: (draft: Omit<Rfq, "id" | "uid" | "createdAt" | "buyerActorId" | "status">) => {
    ok: boolean;
    message: string;
    rfqId?: string;
  };
  updateImporterRfq: (rfqId: string, patch: Partial<Rfq>) => { ok: boolean; message: string };
  archiveImporterRfq: (rfqId: string) => { ok: boolean; message: string };
  createExporterOffer: (draft: Omit<Offer, "id" | "createdAt" | "sellerActorId" | "status">) => {
    ok: boolean;
    message: string;
    offerId?: string;
  };
  updateLotExportReservation: (lotId: string, reservation: string | null) => { ok: boolean; message: string };
  updateBankApprovalRecord: (id: string, patch: Partial<BankApproval>) => { ok: boolean; message: string };
  createLabResultRecord: (draft: Omit<LabResult, "id" | "issuedAt" | "labActorId" | "status">) => {
    ok: boolean;
    message: string;
    labResultId?: string;
  };
  updateLabResultRecord: (id: string, patch: Partial<LabResult>) => { ok: boolean; message: string };
  finalizeLabResultRecord: (
    id: string,
    outcome: "approved" | "failed",
  ) => { ok: boolean; message: string };
  adminArchiveEntity: (
    collection: keyof LiveDataBundle,
    id: string,
  ) => { ok: boolean; message: string };
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
  selectedFarmId: string | null;
  adminDataEntity: keyof LiveDataBundle | null;
  lastOperationMessage: string | null;
  lastMassBalance:
    | { input: number; output: number; typedLossTotal: number; variance: number }
    | null;
  lastOutputLotId: string | null;
  isHydrating: boolean;
  goToState: (state: AppScreenState) => void;
  openListingExplore: (listingType: "rfq" | "auction" | "offer", listingId: string) => void;
  openLotDetail: (lotId: string) => void;
  clearSelectedLot: () => void;
  startTradeFlow: () => void;
  openRfqDetail: (rfqId: string) => void;
  openRfqEdit: (rfqId: string) => void;
  openOfferDetail: (offerId: string) => void;
  openContractDetail: (contractId: string) => void;
  openBankReview: (bankApprovalId: string) => void;
  openBankApprovalEdit: (bankApprovalId: string) => void;
  openLabResult: (labResultId: string) => void;
  openLabResultEdit: (labResultId: string | null) => void;
  openFarmerFieldEdit: (farmId: string) => void;
  setSelectedFarmId: (farmId: string | null) => void;
  setAdminDataEntity: (key: keyof LiveDataBundle | null) => void;
  setOperationResult: (
    message: string | null,
    massBalance?: { input: number; output: number; typedLossTotal: number; variance: number } | null,
    outputLotId?: string | null,
  ) => void;
  advanceState: () => void;
  setHydrating: (isHydrating: boolean) => void;
}

export type AppStore = SessionSlice & AppSlice & DataSlice & UiSlice;

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
    (set, get) => {
      const commitLive = (nextLive: LiveDataBundle) => {
        const seed = get().seedData;
        if (!seed) return;
        writeLiveDataToStorage(nextLive);
        set({
          liveData: nextLive,
          data: mergeLiveWithSeed(seed, nextLive),
        });
        void writeLiveDataToApi(nextLive);
      };

      const patchLive = (fn: (l: LiveDataBundle) => LiveDataBundle) => {
        const live = get().liveData;
        const seed = get().seedData;
        if (!live || !seed) return;
        commitLive(fn(live));
      };

      return {
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

        loginAs: (user) => {
          const data = get().data;
          if (!data) return;
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
          get().loginAs(user);
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
            selectedFarmId: null,
            adminDataEntity: null,
            lastOperationMessage: null,
            lastMassBalance: null,
            lastOutputLotId: null,
            currentState: "auth_login",
            currentStateLabel: stateMeta.auth_login.label,
            primaryActionLabel: stateMeta.auth_login.primaryAction,
          }),

        appName: initialApp.appName,
        environment: initialApp.environment,

        seedData: null,
        liveData: null,
        data: null,

        loadAllMockData: () => {
          set({ isHydrating: true });
          const seed = loadMockData();
          const stored = readLiveDataFromStorage();
          const live = stored ?? cloneLiveFromSeed(seed);
          writeLiveDataToStorage(live);
          const data = mergeLiveWithSeed(seed, live);
          const isAuthenticated = get().authenticated;
          set({
            seedData: seed,
            liveData: live,
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
          void (async () => {
            const remote = await readLiveDataFromApi();
            if (remote) {
              writeLiveDataToStorage(remote);
              set({
                liveData: remote,
                data: mergeLiveWithSeed(seed, remote),
              });
              return;
            }
            // First boot on server-side store: publish local baseline.
            await writeLiveDataToApi(live);
          })();
        },

        resetLiveDataToSeed: () => {
          const seed = get().seedData;
          if (!seed) return;
          const live = cloneLiveFromSeed(seed);
          writeLiveDataToStorage(live);
          void writeLiveDataToApi(live);
          set({
            liveData: live,
            data: mergeLiveWithSeed(seed, live),
            lastOperationMessage: null,
            lastMassBalance: null,
            lastOutputLotId: null,
          });
        },

        exportLiveDataSnapshot: () => {
          const live = get().liveData;
          return JSON.stringify(
            {
              exportedAt: isoNow(),
              version: 1,
              payload: live,
            },
            null,
            2,
          );
        },

        clearLocalState: () => {
          clearLiveStorage();
          const seed = get().seedData ?? loadMockData();
          const live = cloneLiveFromSeed(seed);
          writeLiveDataToStorage(live);
          void writeLiveDataToApi(live);
          set({
            seedData: seed,
            liveData: live,
            data: mergeLiveWithSeed(seed, live),
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
            selectedFarmId: null,
            adminDataEntity: null,
            lastOperationMessage: null,
            lastMassBalance: null,
            lastOutputLotId: null,
            currentState: "auth_login",
            currentStateLabel: stateMeta.auth_login.label,
            primaryActionLabel: stateMeta.auth_login.primaryAction,
          });
        },

        hydrateLiveData: () => {
          const seed = get().seedData;
          if (!seed) return;
          const stored = readLiveDataFromStorage();
          if (stored) {
            set({
              liveData: stored,
              data: mergeLiveWithSeed(seed, stored),
            });
          }
          void (async () => {
            const remote = await readLiveDataFromApi();
            if (!remote) return;
            writeLiveDataToStorage(remote);
            set({
              liveData: remote,
              data: mergeLiveWithSeed(seed, remote),
            });
          })();
        },

        createFarmerLot: (farmId, weightKg) => {
          if (!hasPermission(get, "create_pick_event")) {
            return { ok: false, message: "Not permitted to create pick/lot." };
          }
          if (weightKg <= 0) return { ok: false, message: "Weight must be greater than zero." };
          const data = get().data;
          const userId = get().userId;
          const actorId = get().linkedActorId;
          if (!data || !userId || !actorId) return { ok: false, message: "No active session." };
          const user = data.users.find((item) => item.id === userId);
          const farm = data.farms.find((f) => f.id === farmId);
          if (!user || !farm) return { ok: false, message: "Farm or user missing." };
          if (farm.ownerActorId !== actorId && farm.managerActorId !== actorId) {
            return { ok: false, message: "Field is not owned or managed by you." };
          }
          const now = isoNow();
          let createdLotId = "";
          patchLive((live) => {
            const lotId = nextPrefixedId("lot", live.lots.map((l) => l.id));
            createdLotId = lotId;
            const eventId = nextPrefixedId("evt", live.inventoryEvents.map((e) => e.id));
            const publicLotCode = newPublicLotCode();
            const traceKey = newTraceKey();
            const newLot: Lot = {
              id: lotId,
              internalUuid: newInternalUuid(),
              publicLotCode,
              traceKey,
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
              createdBy: userId,
              updatedBy: userId,
              updatedAt: now,
            };
            const mapEntry: LotCodeMapItem = { publicLotCode, lotId, traceKey };
            const newEvent: InventoryEvent = {
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
              notes: "Pick recorded",
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
            };
            return {
              ...live,
              lots: createEntity(live.lots, newLot),
              inventoryEvents: createEntity(live.inventoryEvents, newEvent),
              lotCodeMap: [...live.lotCodeMap, mapEntry],
            };
          });
          set({ lastOperationMessage: "Provisional lot created.", lastMassBalance: null, lastOutputLotId: null });
          return { ok: true, message: "Pick event created.", lotId: createdLotId };
        },

        createMockPickEvent: (farmId, weightKg) => get().createFarmerLot(farmId, weightKg),

        updateProvisionalLot: (lotId, patch) => {
          const data = get().data;
          const userId = get().userId;
          const actorId = get().linkedActorId;
          if (!data || !userId || !actorId) return { ok: false, message: "No active session." };
          const lot = data.lots.find((l) => l.id === lotId);
          if (!lot) return { ok: false, message: "Lot not found." };
          if (lot.integrityStatus !== "provisional" || lot.originActorId !== actorId) {
            return { ok: false, message: "Only provisional lots you originated can be edited." };
          }
          const now = isoNow();
          patchLive((live) => ({
            ...live,
            lots: updateEntity(live.lots, lotId, {
              ...patch,
              updatedAt: now,
              updatedBy: userId,
            }),
          }));
          set({ lastOperationMessage: `Updated ${lotId}.`, lastMassBalance: null, lastOutputLotId: null });
          return { ok: true, message: "Lot updated." };
        },

        archiveFarmerLot: (lotId) => {
          const data = get().data;
          const actorId = get().linkedActorId;
          if (!data || !actorId) return { ok: false, message: "No active session." };
          const lot = data.lots.find((l) => l.id === lotId);
          if (!lot) return { ok: false, message: "Lot not found." };
          if (lot.originActorId !== actorId) return { ok: false, message: "Not your lot." };
          if (lotHasLineageLinks(lot)) {
            return { ok: false, message: "Cannot remove lots with lineage; archive status only." };
          }
          const now = isoNow();
          const userId = get().userId ?? "";
          patchLive((live) => ({
            ...live,
            lots: updateEntity(live.lots, lotId, {
              status: "cancelled",
              integrityStatus: "provisional",
              updatedAt: now,
              updatedBy: userId,
            }),
          }));
          set({ lastOperationMessage: `Lot ${lotId} cancelled.`, lastMassBalance: null, lastOutputLotId: null });
          return { ok: true, message: "Lot archived." };
        },

        createFarmField: (input) => {
          if (!hasPermission(get, "view_own_farms")) {
            return { ok: false, message: "Not permitted to manage fields." };
          }
          const data = get().data;
          const userId = get().userId;
          const actorId = get().linkedActorId;
          if (!data || !userId || !actorId) return { ok: false, message: "No active session." };
          const user = data.users.find((u) => u.id === userId);
          if (!user) return { ok: false, message: "User missing." };
          const now = isoNow();
          const farmId = nextPrefixedId("farm", data.farms.map((f) => f.id));
          const farm: Farm = {
            id: farmId,
            uid: input.uid ?? newFarmUid(),
            name: input.name,
            ownerActorId: actorId,
            managerActorId: actorId,
            organizationId: user.organizationId,
            region: input.region,
            zone: input.zone,
            woreda: input.woreda,
            kebele: input.kebele,
            country: input.country,
            elevationM: input.elevationM,
            sizeHectares: input.sizeHectares,
            coffeeVarieties: input.coffeeVarieties,
            farmingType: input.farmingType,
            coordinates: input.coordinates,
            polygon: input.polygon ?? [],
            eudrStatus: input.eudrStatus,
            status: input.status ?? "active",
            notes: input.notes,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            updatedBy: userId,
          };
          let created: Farm | undefined;
          patchLive((live) => {
            created = farm;
            return { ...live, farms: createEntity(live.farms, farm) };
          });
          set({ lastOperationMessage: `Field ${farm.name} created.`, lastMassBalance: null, lastOutputLotId: null });
          return { ok: true, message: "Field created.", farm: created };
        },

        updateFarmField: (farmId, patch) => {
          if (!hasPermission(get, "view_own_farms")) {
            return { ok: false, message: "Not permitted." };
          }
          const data = get().data;
          const actorId = get().linkedActorId;
          const userId = get().userId;
          if (!data || !actorId || !userId) return { ok: false, message: "No session." };
          const farm = data.farms.find((f) => f.id === farmId);
          if (!farm) return { ok: false, message: "Field not found." };
          if (farm.ownerActorId !== actorId && farm.managerActorId !== actorId) {
            return { ok: false, message: "Not your field." };
          }
          const now = isoNow();
          patchLive((live) => ({
            ...live,
            farms: updateEntity(live.farms, farmId, {
              ...patch,
              updatedAt: now,
              updatedBy: userId,
            }),
          }));
          return { ok: true, message: "Field updated." };
        },

        archiveFarmField: (farmId) => {
          const res = get().updateFarmField(farmId, { status: "archived" });
          if (!res.ok) return res;
          return { ok: true, message: "Field archived." };
        },

        validatePendingLot: (lotId, confirmedWeightKg) => {
          if (!hasPermission(get, "validate_pick_event")) {
            return { ok: false, message: "Not permitted to validate." };
          }
          if (confirmedWeightKg <= 0) return { ok: false, message: "Confirmed weight must be positive." };
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No active session." };
          const user = data.users.find((item) => item.id === userId);
          const targetLot = data.lots.find((lot) => lot.id === lotId);
          if (!user || !targetLot) return { ok: false, message: "Lot or user missing." };
          const varianceKg = Math.max(targetLot.weightKg - confirmedWeightKg, 0);
          const now = isoNow();
          patchLive((live) => {
            const eventId = nextPrefixedId("evt", live.inventoryEvents.map((e) => e.id));
            const newEvent: InventoryEvent = {
              id: eventId,
              type: "VALIDATE_PICK",
              timestamp: now,
              lotId,
              actorId: user.linkedActorId,
              fromActorId: targetLot.originActorId,
              toActorId: user.linkedActorId,
              reportedWeightKg: targetLot.weightKg,
              confirmedWeightKg,
              varianceKg,
              status: "recorded",
              verificationStatus: "verified",
              notes: "Validated pick",
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
            };
            return {
              ...live,
              lots: updateEntity(live.lots, lotId, {
                weightKg: confirmedWeightKg,
                status: "in_stock",
                integrityStatus: "verified",
                updatedAt: now,
                updatedBy: userId,
              }),
              inventoryEvents: createEntity(live.inventoryEvents, newEvent),
            };
          });
          set({ lastOperationMessage: `Lot ${lotId} validated.`, lastMassBalance: null, lastOutputLotId: null });
          return { ok: true, message: "Lot validated." };
        },

        receiveLotAsAggregator: (lotId, notes = "") => {
          if (!hasPermission(get, "view_received_lots")) {
            return { ok: false, message: "Not permitted." };
          }
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No session." };
          const user = data.users.find((u) => u.id === userId);
          const lot = data.lots.find((l) => l.id === lotId);
          if (!user || !lot) return { ok: false, message: "Missing lot or user." };
          const now = isoNow();
          patchLive((live) => {
            const eventId = nextPrefixedId("evt", live.inventoryEvents.map((e) => e.id));
            const ev: InventoryEvent = {
              id: eventId,
              type: "RECEIVE",
              timestamp: now,
              lotId,
              actorId: user.linkedActorId,
              fromActorId: lot.currentCustodianActorId,
              toActorId: user.linkedActorId,
              weightKg: lot.weightKg,
              status: "recorded",
              verificationStatus: "verified",
              notes: notes || "Received at aggregator",
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
            };
            return {
              ...live,
              inventoryEvents: createEntity(live.inventoryEvents, ev),
              lots: updateEntity(live.lots, lotId, {
                currentCustodianActorId: user.linkedActorId,
                updatedAt: now,
                updatedBy: userId,
              }),
            };
          });
          set({ lastOperationMessage: `Received ${lotId}.`, lastMassBalance: null, lastOutputLotId: null });
          return { ok: true, message: "Receive recorded." };
        },

        createAggregatedLot: (parentLotIds, weightKg, notes) => {
          if (!hasPermission(get, "aggregate_lots")) {
            return { ok: false, message: "Not permitted to aggregate." };
          }
          if (parentLotIds.length < 2) return { ok: false, message: "Select at least two lots." };
          if (weightKg <= 0) return { ok: false, message: "Weight must be positive." };
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No session." };
          const user = data.users.find((u) => u.id === userId);
          if (!user) return { ok: false, message: "User missing." };
          const parents = parentLotIds.map((id) => data.lots.find((l) => l.id === id));
          if (parents.some((p) => !p)) return { ok: false, message: "Unknown parent lot." };
          const now = isoNow();
          let newLotId = "";
          patchLive((live) => {
            const lotId = nextPrefixedId("lot", live.lots.map((l) => l.id));
            newLotId = lotId;
            const eventId = nextPrefixedId("evt", live.inventoryEvents.map((e) => e.id));
            const publicLotCode = newPublicLotCode();
            const traceKey = newTraceKey();
            const agg: Lot = {
              id: lotId,
              internalUuid: newInternalUuid(),
              publicLotCode,
              traceKey,
              commodity: "coffee",
              form: "cherry",
              sourceType: "aggregated",
              farmId: null,
              originActorId: user.linkedActorId,
              currentOwnerActorId: user.linkedActorId,
              currentCustodianActorId: user.linkedActorId,
              facilityId: live.facilities[0]?.id ?? null,
              weightKg,
              status: "in_stock",
              qualityGrade: null,
              parentLotIds,
              childLotIds: [],
              harvestDate: now,
              createdAt: now,
              geoInherited: true,
              integrityStatus: "verified",
              createdBy: userId,
              updatedBy: userId,
              updatedAt: now,
            };
            let nextLots = createEntity(live.lots, agg);
            for (const pid of parentLotIds) {
              const p = nextLots.find((l) => l.id === pid);
              if (p) {
                nextLots = updateEntity(nextLots, pid, {
                  childLotIds: [...p.childLotIds, lotId],
                  updatedAt: now,
                  updatedBy: userId,
                });
              }
            }
            const ev: InventoryEvent = {
              id: eventId,
              type: "AGGREGATE",
              timestamp: now,
              lotId,
              actorId: user.linkedActorId,
              parentLotIds,
              inputWeightKg: parents.reduce((s, pl) => s + (pl?.weightKg ?? 0), 0),
              outputWeightKg: weightKg,
              status: "recorded",
              verificationStatus: "verified",
              notes: notes ?? "Aggregated intake",
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
            };
            return {
              ...live,
              lots: nextLots,
              inventoryEvents: createEntity(live.inventoryEvents, ev),
              lotCodeMap: [...live.lotCodeMap, { publicLotCode, lotId, traceKey }],
            };
          });
          set({ lastOperationMessage: `Aggregate ${newLotId} created.`, lastMassBalance: null, lastOutputLotId: null });
          return { ok: true, message: "Aggregate created.", lotId: newLotId };
        },

        processLotWithLosses: (lotId, outputWeightKg, losses, opts) => {
          if (!hasPermission(get, "record_processing_event")) {
            return { ok: false, message: "Not permitted to process." };
          }
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No active session." };
          const user = data.users.find((item) => item.id === userId);
          const lot = data.lots.find((item) => item.id === lotId);
          if (!user || !lot) return { ok: false, message: "Lot or user missing." };
          if (lot.status === "consumed") return { ok: false, message: "Lot already consumed." };
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
          const massBalance = { input, output: outputWeightKg, typedLossTotal, variance };
          const now = isoNow();
          const processType = opts?.processType ?? "PROCESS_PULP_AND_WASH";
          const facilityId = opts?.facilityId ?? lot.facilityId;
          let outputLotId = "";
          patchLive((live) => {
            const childId = nextPrefixedId("lot", live.lots.map((l) => l.id));
            outputLotId = childId;
            const eventId = nextPrefixedId("evt", live.inventoryEvents.map((e) => e.id));
            const publicLotCode = newPublicLotCode();
            const traceKey = newTraceKey();
            const childLot: Lot = {
              id: childId,
              internalUuid: newInternalUuid(),
              publicLotCode,
              traceKey,
              commodity: "coffee",
              form: "parchment",
              sourceType: "processed",
              farmId: null,
              originActorId: user.linkedActorId,
              currentOwnerActorId: lot.currentOwnerActorId,
              currentCustodianActorId: user.linkedActorId,
              facilityId,
              weightKg: outputWeightKg,
              status: "awaiting_transport",
              labStatus: "pending_transport",
              qualityGrade: opts?.qualityGrade ?? null,
              parentLotIds: [lotId],
              childLotIds: [],
              harvestDate: lot.harvestDate,
              createdAt: now,
              geoInherited: true,
              integrityStatus: "verified",
              notes: opts?.notes,
              createdBy: userId,
              updatedBy: userId,
              updatedAt: now,
            };
            const parentUpdated = updateEntity(live.lots, lotId, {
              childLotIds: [...lot.childLotIds, childId],
              status: "consumed",
              integrityStatus: "verified",
              updatedAt: now,
              updatedBy: userId,
            });
            const newEvent: InventoryEvent = {
              id: eventId,
              type: processType,
              timestamp: now,
              lotId,
              parentLotIds: lot.parentLotIds,
              outputLotIds: [childId],
              actorId: user.linkedActorId,
              facilityId,
              inputWeightKg: input,
              outputWeightKg,
              losses,
              varianceKg: variance,
              status: "recorded",
              verificationStatus: "verified",
              notes: opts?.notes ?? "Processed with typed losses",
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
            };
            return {
              ...live,
              lots: createEntity(parentUpdated, childLot),
              inventoryEvents: createEntity(live.inventoryEvents, newEvent),
              lotCodeMap: [...live.lotCodeMap, { publicLotCode, lotId: childId, traceKey }],
            };
          });
          set({
            lastOperationMessage: `Processed ${lotId}; output ${outputLotId}.`,
            lastMassBalance: massBalance,
            lastOutputLotId: outputLotId,
          });
          return { ok: true, message: "Lot processed.", massBalance, outputLotId };
        },

        acceptTransportCustody: (lotId) => {
          if (!hasPermission(get, "accept_custody")) {
            return { ok: false, message: "Not permitted to accept custody." };
          }
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No active session." };
          const user = data.users.find((item) => item.id === userId);
          const lot = data.lots.find((item) => item.id === lotId);
          if (!user || !lot) return { ok: false, message: "Lot or user missing." };
          const now = isoNow();
          patchLive((live) => {
            const eventId = nextPrefixedId("evt", live.inventoryEvents.map((e) => e.id));
            const newEvent: InventoryEvent = {
              id: eventId,
              type: "TRANSFER_CUSTODY",
              timestamp: now,
              lotId,
              actorId: user.linkedActorId,
              fromActorId: lot.currentCustodianActorId,
              toActorId: user.linkedActorId,
              weightKg: lot.weightKg,
              status: "recorded",
              verificationStatus: "verified",
              notes: "Custody accepted",
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
            };
            const nextStatus = lot.status === "awaiting_transport" ? "in_transit" : lot.status;
            return {
              ...live,
              lots: updateEntity(live.lots, lotId, {
                currentCustodianActorId: user.linkedActorId,
                status: nextStatus,
                updatedAt: now,
                updatedBy: userId,
              }),
              inventoryEvents: createEntity(live.inventoryEvents, newEvent),
            };
          });
          set({ lastOperationMessage: `Custody accepted for ${lotId}.`, lastMassBalance: null, lastOutputLotId: null });
          return { ok: true, message: "Custody accepted." };
        },

        handoverCustodyToLab: (lotId) => {
          if (!hasPermission(get, "handover_custody")) {
            return { ok: false, message: "Not permitted to hand over custody." };
          }
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No session." };
          const user = data.users.find((item) => item.id === userId);
          const lot = data.lots.find((item) => item.id === lotId);
          const labActor = data.actors.find((a) => a.primaryRole === "lab_officer");
          if (!user || !lot || !labActor) return { ok: false, message: "Lot or lab actor missing." };
          if (lot.currentCustodianActorId !== user.linkedActorId) {
            return { ok: false, message: "You are not the current custodian." };
          }
          if (lot.status !== "in_transit" || lot.labStatus !== "pending_transport") {
            return { ok: false, message: "Lot is not in transit for lab handoff." };
          }
          const now = isoNow();
          patchLive((live) => {
            const eventId = nextPrefixedId("evt", live.inventoryEvents.map((e) => e.id));
            const ev: InventoryEvent = {
              id: eventId,
              type: "HANDOVER_TO_LAB",
              timestamp: now,
              lotId,
              actorId: user.linkedActorId,
              fromActorId: lot.currentCustodianActorId,
              toActorId: labActor.id,
              weightKg: lot.weightKg,
              status: "recorded",
              verificationStatus: "verified",
              notes: "Custody handed to lab",
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
            };
            return {
              ...live,
              lots: updateEntity(live.lots, lotId, {
                currentCustodianActorId: labActor.id,
                status: "lab_intake",
                labStatus: "at_lab",
                updatedAt: now,
                updatedBy: userId,
              }),
              inventoryEvents: createEntity(live.inventoryEvents, ev),
            };
          });
          set({ lastOperationMessage: `Lot ${lotId} handed to lab.`, lastMassBalance: null, lastOutputLotId: null });
          return { ok: true, message: "Handed to lab." };
        },

        appendInventoryEvent: (partial) => {
          if (!isSupportedEventType(partial.type)) {
            return { ok: false, message: "Unsupported event type." };
          }
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No session." };
          const now = isoNow();
          const id = partial.id ?? nextPrefixedId("evt", data.inventoryEvents.map((e) => e.id));
          const event: InventoryEvent = {
            ...partial,
            id,
            createdBy: userId,
            updatedBy: userId,
            createdAt: now,
            updatedAt: now,
          };
          patchLive((live) => ({
            ...live,
            inventoryEvents: createEntity(live.inventoryEvents, event),
          }));
          return { ok: true, message: "Event recorded." };
        },

        quarantineLot: (lotId, reason) => {
          if (!hasPermission(get, "view_all_quarantined_lots")) {
            return { ok: false, message: "Admin only." };
          }
          const userId = get().userId ?? "";
          const now = isoNow();
          patchLive((live) => {
            const eventId = nextPrefixedId("evt", live.inventoryEvents.map((e) => e.id));
            const lot = live.lots.find((l) => l.id === lotId);
            const ev: InventoryEvent = {
              id: eventId,
              type: "QUARANTINE",
              timestamp: now,
              lotId,
              actorId: get().linkedActorId ?? "",
              status: "recorded",
              verificationStatus: "verified",
              notes: reason ?? "Quarantined",
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
            };
            return {
              ...live,
              lots: updateEntity(live.lots, lotId, {
                status: "quarantined",
                integrityStatus: "compromised",
                updatedAt: now,
                updatedBy: userId,
              }),
              inventoryEvents: createEntity(live.inventoryEvents, ev),
            };
          });
          return { ok: true, message: "Lot quarantined." };
        },

        releaseLotQuarantine: (lotId) => {
          if (!hasPermission(get, "view_all_quarantined_lots")) {
            return { ok: false, message: "Admin only." };
          }
          const userId = get().userId ?? "";
          const now = isoNow();
          patchLive((live) => {
            const eventId = nextPrefixedId("evt", live.inventoryEvents.map((e) => e.id));
            const ev: InventoryEvent = {
              id: eventId,
              type: "RELEASE_QUARANTINE",
              timestamp: now,
              lotId,
              actorId: get().linkedActorId ?? "",
              status: "recorded",
              verificationStatus: "verified",
              notes: "Quarantine released",
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
            };
            return {
              ...live,
              lots: updateEntity(live.lots, lotId, {
                status: "in_stock",
                integrityStatus: "verified",
                updatedAt: now,
                updatedBy: userId,
              }),
              inventoryEvents: createEntity(live.inventoryEvents, ev),
            };
          });
          return { ok: true, message: "Quarantine released." };
        },

        createImporterRfq: (draft) => {
          if (!hasPermission(get, "create_rfq")) {
            return { ok: false, message: "Not permitted." };
          }
          const data = get().data;
          const userId = get().userId;
          const actorId = get().linkedActorId;
          if (!data || !userId || !actorId) return { ok: false, message: "No session." };
          const now = isoNow();
          let rfqId = "";
          patchLive((live) => {
            const id = nextPrefixedId("rfq", live.rfqs.map((r) => r.id));
            rfqId = id;
            const rfq: Rfq = {
              id,
              uid: newRfqUid(),
              buyerActorId: actorId,
              status: "draft",
              createdAt: now,
              participationRule: draft.participationRule ?? "invite_only",
              minimumTrustScore: draft.minimumTrustScore ?? 0,
              invitedActorIds: draft.invitedActorIds ?? [],
              title: draft.title,
              commodity: draft.commodity,
              form: draft.form,
              targetQuantityKg: draft.targetQuantityKg,
              minimumGrade: draft.minimumGrade,
              originPreference: draft.originPreference,
              incoterm: draft.incoterm,
              deliveryWindowStart: draft.deliveryWindowStart,
              deliveryWindowEnd: draft.deliveryWindowEnd,
            };
            return { ...live, rfqs: createEntity(live.rfqs, rfq) };
          });
          return { ok: true, message: "RFQ draft created.", rfqId };
        },

        updateImporterRfq: (rfqId, patch) => {
          if (!hasPermission(get, "create_rfq")) return { ok: false, message: "Not permitted." };
          const data = get().data;
          const actorId = get().linkedActorId;
          const userId = get().userId;
          if (!data || !actorId || !userId) return { ok: false, message: "No session." };
          const rfq = data.rfqs.find((r) => r.id === rfqId);
          if (!rfq || rfq.buyerActorId !== actorId) return { ok: false, message: "Not your RFQ." };
          const now = isoNow();
          patchLive((live) => ({
            ...live,
            rfqs: updateEntity(live.rfqs, rfqId, { ...patch, updatedAt: now, updatedBy: userId }),
          }));
          return { ok: true, message: "RFQ updated." };
        },

        archiveImporterRfq: (rfqId) => {
          return get().updateImporterRfq(rfqId, { status: "archived" });
        },

        createExporterOffer: (draft) => {
          if (!hasPermission(get, "create_offer")) {
            return { ok: false, message: "Not permitted." };
          }
          const data = get().data;
          const userId = get().userId;
          const actorId = get().linkedActorId;
          if (!data || !userId || !actorId) return { ok: false, message: "No session." };
          const now = isoNow();
          let offerId = "";
          patchLive((live) => {
            const id = nextPrefixedId("offer", live.offers.map((o) => o.id));
            offerId = id;
            const offer: Offer = {
              id,
              rfqId: draft.rfqId,
              sellerActorId: actorId,
              linkedLotIds: draft.linkedLotIds,
              offeredQuantityKg: draft.offeredQuantityKg,
              pricePerKgUsd: draft.pricePerKgUsd,
              currency: draft.currency,
              status: "draft",
              createdAt: now,
            };
            return { ...live, offers: createEntity(live.offers, offer) };
          });
          return { ok: true, message: "Offer draft saved.", offerId };
        },

        updateLotExportReservation: (lotId, reservation) => {
          if (!hasPermission(get, "reserve_lots")) {
            return { ok: false, message: "Not permitted." };
          }
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No session." };
          const now = isoNow();
          patchLive((live) => {
            const cur = live.lots.find((l) => l.id === lotId);
            if (!cur) return live;
            const hasRes = reservation != null && reservation !== "";
            const nextStatus =
              hasRes
                ? "contract_reserved"
                : cur.status === "contract_reserved"
                  ? "ready_for_export"
                  : cur.status;
            return {
              ...live,
              lots: updateEntity(live.lots, lotId, {
                exportReservationStatus: reservation,
                status: nextStatus,
                updatedAt: now,
                updatedBy: userId,
              }),
            };
          });
          return { ok: true, message: "Reservation updated." };
        },

        updateBankApprovalRecord: (id, patch) => {
          if (!hasPermission(get, "approve_trade") && !hasPermission(get, "issue_guarantee")) {
            return { ok: false, message: "Not permitted." };
          }
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No session." };
          const row = data.bankApprovals.find((b) => b.id === id);
          if (!row || row.bankActorId !== get().linkedActorId) {
            return { ok: false, message: "Not your approval record." };
          }
          const now = isoNow();
          patchLive((live) => ({
            ...live,
            bankApprovals: updateEntity(live.bankApprovals, id, {
              ...patch,
              updatedAt: now,
              updatedBy: userId,
            }),
          }));
          return { ok: true, message: "Approval updated." };
        },

        createLabResultRecord: (draft) => {
          if (!hasPermission(get, "record_lab_results")) {
            return { ok: false, message: "Not permitted." };
          }
          const data = get().data;
          const userId = get().userId;
          const actorId = get().linkedActorId;
          if (!data || !userId || !actorId) return { ok: false, message: "No session." };
          const lot = data.lots.find((l) => l.id === draft.lotId);
          if (!lot || !isLabIntakeLot(lot, actorId)) {
            return { ok: false, message: "Lot is not in your lab intake queue." };
          }
          if (hasFinalLabOutcomeForLot(draft.lotId, data.labResults)) {
            return { ok: false, message: "A finalized result already exists for this lot." };
          }
          if (data.labResults.some((r) => r.lotId === draft.lotId && r.status === "pending")) {
            return { ok: false, message: "A draft result already exists for this lot." };
          }
          const now = isoNow();
          let labResultId = "";
          patchLive((live) => {
            const id = nextPrefixedId("labres", live.labResults.map((l) => l.id));
            labResultId = id;
            const lab: LabResult = {
              id,
              lotId: draft.lotId,
              contractId: draft.contractId?.trim() ? draft.contractId.trim() : "",
              labActorId: actorId,
              sampleCode: draft.sampleCode,
              moisturePercent: draft.moisturePercent,
              screenSize: draft.screenSize,
              defectCount: draft.defectCount,
              cupScore: draft.cupScore,
              gradeConfirmed: draft.gradeConfirmed,
              status: "pending",
              issuedAt: now,
            };
            return { ...live, labResults: createEntity(live.labResults, lab) };
          });
          return { ok: true, message: "Lab result created.", labResultId };
        },

        updateLabResultRecord: (id, patch) => {
          if (!hasPermission(get, "record_lab_results")) {
            return { ok: false, message: "Not permitted." };
          }
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No session." };
          const row = data.labResults.find((l) => l.id === id);
          if (!row || row.labActorId !== get().linkedActorId) {
            return { ok: false, message: "Not your lab result." };
          }
          if (row.status !== "pending") return { ok: false, message: "Only draft (pending) results can be edited." };
          const now = isoNow();
          patchLive((live) => ({
            ...live,
            labResults: updateEntity(live.labResults, id, {
              ...patch,
              updatedAt: now,
              updatedBy: userId,
            }),
          }));
          return { ok: true, message: "Lab result updated." };
        },

        finalizeLabResultRecord: (id, outcome) => {
          if (!hasPermission(get, "issue_quality_report")) {
            return { ok: false, message: "Not permitted." };
          }
          const data = get().data;
          const userId = get().userId;
          if (!data || !userId) return { ok: false, message: "No session." };
          const row = data.labResults.find((l) => l.id === id);
          if (!row || row.labActorId !== get().linkedActorId) {
            return { ok: false, message: "Not your lab result." };
          }
          if (row.status !== "pending") {
            return { ok: false, message: "Only pending results can be finalized." };
          }
          const now = isoNow();
          const terminalStatus = outcome === "approved" ? "approved" : "failed";
          patchLive((live) => {
            const nextLabResults = updateEntity(live.labResults, id, {
              status: terminalStatus,
              issuedAt: now,
              updatedAt: now,
              updatedBy: userId,
            });
            const target = live.lots.find((l) => l.id === row.lotId);
            if (!target) {
              return { ...live, labResults: nextLabResults };
            }
            if (outcome === "approved") {
              return {
                ...live,
                labResults: nextLabResults,
                lots: updateEntity(live.lots, row.lotId, {
                  labStatus: "lab_cleared",
                  status: "ready_for_export",
                  currentCustodianActorId: target.currentOwnerActorId,
                  updatedAt: now,
                  updatedBy: userId,
                }),
              };
            }
            return {
              ...live,
              labResults: nextLabResults,
              lots: updateEntity(live.lots, row.lotId, {
                labStatus: "lab_failed",
                status: "lab_rejected",
                updatedAt: now,
                updatedBy: userId,
              }),
            };
          });
          return { ok: true, message: `Lab result ${terminalStatus}.` };
        },

        adminArchiveEntity: (collection, id) => {
          if (!hasPermission(get, "manage_master_data")) {
            return { ok: false, message: "Admin only." };
          }
          const userId = get().userId ?? "";
          const now = isoNow();
          patchLive((live) => {
            if (collection === "lots") {
              return {
                ...live,
                lots: updateEntity(live.lots, id, {
                  status: "archived",
                  updatedAt: now,
                  updatedBy: userId,
                }),
              };
            }
            if (collection === "inventoryEvents") {
              return {
                ...live,
                inventoryEvents: updateEntity(live.inventoryEvents, id, {
                  status: "archived",
                  updatedAt: now,
                  updatedBy: userId,
                }),
              };
            }
            const arr = live[collection];
            if (!Array.isArray(arr)) return live;
            const next = archiveEntity(arr as { id: string; status?: string }[], id, "archived");
            return { ...live, [collection]: next } as LiveDataBundle;
          });
          return { ok: true, message: "Archived." };
        },

        stageLabel: "Stage 14 — Admin Role Monitor",
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
        selectedFarmId: null,
        adminDataEntity: null,
        lastOperationMessage: null,
        lastMassBalance: null,
        lastOutputLotId: null,
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

        clearSelectedLot: () => set({ selectedLotId: null }),

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

        openRfqEdit: (rfqId) =>
          set({
            selectedRfqId: rfqId,
            currentState: "rfq_edit",
            currentStateLabel: stateMeta.rfq_edit.label,
            primaryActionLabel: stateMeta.rfq_edit.primaryAction,
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

        openBankApprovalEdit: (bankApprovalId) =>
          set({
            selectedBankApprovalId: bankApprovalId,
            currentState: "bank_approval_edit",
            currentStateLabel: stateMeta.bank_approval_edit.label,
            primaryActionLabel: stateMeta.bank_approval_edit.primaryAction,
          }),

        openLabResult: (labResultId) =>
          set({
            selectedLabResultId: labResultId,
            currentState: "lab_result",
            currentStateLabel: stateMeta.lab_result.label,
            primaryActionLabel: stateMeta.lab_result.primaryAction,
          }),

        openLabResultEdit: (labResultId) =>
          set({
            selectedLabResultId: labResultId,
            currentState: "lab_result_edit",
            currentStateLabel: stateMeta.lab_result_edit.label,
            primaryActionLabel: stateMeta.lab_result_edit.primaryAction,
          }),

        openFarmerFieldEdit: (farmId) =>
          set({
            selectedFarmId: farmId,
            currentState: "farmer_field_edit",
            currentStateLabel: stateMeta.farmer_field_edit.label,
            primaryActionLabel: stateMeta.farmer_field_edit.primaryAction,
          }),

        setSelectedFarmId: (farmId) => set({ selectedFarmId: farmId }),

        setAdminDataEntity: (key) => set({ adminDataEntity: key }),

        setOperationResult: (message, massBalance = null, outputLotId = null) =>
          set({
            lastOperationMessage: message,
            lastMassBalance: massBalance,
            lastOutputLotId: outputLotId ?? null,
          }),

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
      };
    },
    {
      name: getRuntimeSessionStorageKey(),
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
