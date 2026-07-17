import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@config/routes";
import type { AuthUser } from "@app-types/auth";
import { useUserProfile } from "@features/user-dashboard/hooks/useUserProfile";
import { useOrganisation } from "@features/user-dashboard/hooks/useOrganisation";
import {
  PROFILE_CARD_IDS,
  PROFILE_CARD_ORDER_STORAGE_KEY,
} from "@features/user-dashboard/config";
import ProfileBanner from "./ProfileBanner";
import OrgDashboardCard from "./OrgDashboardCard";
import ProfileContactCard from "./ProfileContactCard";
import ProfileBioCard from "./ProfileBioCard";
import ProfileSocialsCard from "./ProfileSocialsCard";
import EditProfileModal from "./EditProfileModal";
import EditContactModal from "./EditContactModal";
import EditBioModal from "./EditBioModal";
import EditSocialsModal from "./EditSocialsModal";
import CreateOrgModal from "./CreateOrgModal";
import ReorderSheet from "./ReorderSheet";

type CardId = (typeof PROFILE_CARD_IDS)[number];
type ModalType = "profile" | "contact" | "bio" | "socials" | "createOrg" | null;

interface ProfileSectionProps {
  user: AuthUser;
}

function loadOrder(userId: string): CardId[] {
  try {
    const raw = localStorage.getItem(PROFILE_CARD_ORDER_STORAGE_KEY(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      const valid = parsed.filter((id): id is CardId =>
        (PROFILE_CARD_IDS as readonly string[]).includes(id),
      );
      const missing = PROFILE_CARD_IDS.filter((id) => !valid.includes(id));
      return [...valid, ...missing];
    }
  } catch {
    // ignore
  }
  return [...PROFILE_CARD_IDS];
}

function saveOrder(userId: string, order: CardId[]) {
  localStorage.setItem(
    PROFILE_CARD_ORDER_STORAGE_KEY(userId),
    JSON.stringify(order),
  );
}

export default function ProfileSection({ user: initialUser }: ProfileSectionProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser>(initialUser);
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cardOrder, setCardOrder] = useState<CardId[]>(() =>
    loadOrder(initialUser.id),
  );
  const { profile, updateContact, updateBio, updateSocials } = useUserProfile(user.id);
  const org = useOrganisation();

  useEffect(() => {
    void org.load();
    // load once on mount — no dep on org to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleSaveOrder(newOrder: CardId[]) {
    setCardOrder(newOrder);
    saveOrder(user.id, newOrder);
    setReorderOpen(false);
  }

  function handleSelectCard(id: CardId, currentDraftOrder: CardId[]) {
    // Save whatever order was set before navigating away
    handleSaveOrder(currentDraftOrder);
    switch (id) {
      case "org":
        navigate(ROUTES.orgDashboard);
        break;
      case "contact":
        setOpenModal("contact");
        break;
      case "bio":
        setOpenModal("bio");
        break;
      case "socials":
        setOpenModal("socials");
        break;
    }
  }

  function renderCard(id: CardId) {
    switch (id) {
      case "org":
        return (
          <OrgDashboardCard
            key="org"
            data={org.data}
            loading={org.loading}
            error={org.error}
            onCreateOrg={() => setOpenModal("createOrg")}
            onUpdateName={async (name) => {
              await org.update(name);
              showToast("Organisation updated");
            }}
          />
        );
      case "contact":
        return (
          <ProfileContactCard
            key="contact"
            phone={profile.phone}
            countryCode={profile.countryCode}
            email={user.email}
            onEdit={() => setOpenModal("contact")}
          />
        );
      case "bio":
        return (
          <ProfileBioCard
            key="bio"
            profession={profile.profession}
            about={profile.about}
            description={profile.description}
            onEdit={() => setOpenModal("bio")}
          />
        );
      case "socials":
        return (
          <ProfileSocialsCard
            key="socials"
            socials={profile.socials}
            onEdit={() => setOpenModal("socials")}
          />
        );
    }
  }

  return (
    <div className="min-h-[60vh] pb-24">
      <ProfileBanner
        user={user}
        phone={profile.phone}
        countryCode={profile.countryCode}
        onEditProfile={() => setOpenModal("profile")}
      />

      <div className="-mt-10 relative z-10 px-4 pb-4">
        <div className="space-y-4">
          {cardOrder.map((id) => renderCard(id))}
        </div>
      </div>

      {/* FAB — reorder cards */}
      <button
        type="button"
        onClick={() => setReorderOpen(true)}
        aria-label="Reorder cards"
        className="fixed bottom-24 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg text-primary-content hover:opacity-90 active:scale-95 transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      <ReorderSheet
        open={reorderOpen}
        cardOrder={cardOrder}
        onSave={handleSaveOrder}
        onClose={() => setReorderOpen(false)}
        onSelect={handleSelectCard}
      />

      <EditProfileModal
        open={openModal === "profile"}
        user={user}
        onSave={(updatedUser) => {
          setUser(updatedUser);
          setOpenModal(null);
          showToast("Profile updated successfully");
        }}
        onClose={() => setOpenModal(null)}
      />

      <EditContactModal
        open={openModal === "contact"}
        phone={profile.phone}
        countryCode={profile.countryCode}
        onSave={(p, cc) => {
          updateContact(p, cc);
          setOpenModal(null);
        }}
        onClose={() => setOpenModal(null)}
      />

      <EditBioModal
        open={openModal === "bio"}
        profession={profile.profession}
        about={profile.about}
        description={profile.description}
        onSave={(prof, ab, desc) => {
          updateBio(prof, ab, desc);
          setOpenModal(null);
        }}
        onClose={() => setOpenModal(null)}
      />

      <EditSocialsModal
        open={openModal === "socials"}
        socials={profile.socials}
        onSave={(s) => {
          updateSocials(s);
          setOpenModal(null);
        }}
        onClose={() => setOpenModal(null)}
      />

      <CreateOrgModal
        open={openModal === "createOrg"}
        onClose={() => setOpenModal(null)}
        onSubmit={async (name) => {
          await org.create(name);
          showToast("Organisation created!");
        }}
      />

      {toastMessage && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
