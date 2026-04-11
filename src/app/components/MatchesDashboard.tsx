import { useState } from "react";
import { useApp, Property, TenantProfile } from "../store";
import { useNavigate } from "react-router";
import { Heart, Star, Clock, Users, MapPin, ChevronRight, XCircle, Undo2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function MatchesDashboard() {
  const { user, properties, swipes, superInterests, canSuperInterest, addSuperInterest, withdrawInterest, unmatchFromProperty, tenantProfiles } = useApp();
  const navigate = useNavigate();

  // Properties user swiped right on
  const rightSwipes = swipes.filter((s) => s.direction === "right").map((s) => s.propertyId);
  const matchedProperties = properties
    .filter((p) => rightSwipes.includes(p.id) || p.matchedTenants.includes(user?.id || ""))
    .sort((a, b) => {
      const aIntCount = Math.max(a.interestedTenants.length, 1);
      const bIntCount = Math.max(b.interestedTenants.length, 1);
      return a.weeklyPrice / aIntCount - b.weeklyPrice / bIntCount;
    });

  const superInterestIds = superInterests.map((s) => s.propertyId);
  const canUseSuperInterest = canSuperInterest();

  // Check archiving logic
  const now = Date.now();
  const getArchiveStatus = (p: Property) => {
    const expiryMs = new Date(p.expiryDate).getTime();
    const isInterested = superInterestIds.includes(p.id);
    if (isInterested && now > expiryMs + 31 * 24 * 60 * 60 * 1000) return "archived";
    if (!isInterested && now > expiryMs + 14 * 24 * 60 * 60 * 1000) return "archived";
    return "active";
  };

  const activeMatches = matchedProperties.filter((p) => getArchiveStatus(p) !== "archived");

  const nextSuperAvailable = superInterests.length > 0
    ? new Date(superInterests[superInterests.length - 1].timestamp + 72 * 60 * 60 * 1000)
    : null;

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2>Your Matches</h2>
        <div className="flex items-center gap-1 text-[0.75rem] text-muted-foreground">
          <Star className="w-3.5 h-3.5" />
          {canUseSuperInterest ? (
            <span className="text-primary">Super Interest available!</span>
          ) : nextSuperAvailable ? (
            <span>Resets {nextSuperAvailable.toLocaleDateString()}</span>
          ) : null}
        </div>
      </div>

      {activeMatches.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2">No matches yet</h3>
          <p className="text-muted-foreground text-[0.85rem] mb-4">Start swiping to find your perfect home!</p>
          <button onClick={() => navigate("/swipe")} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl">
            Discover properties
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeMatches.map((p) => (
            <MatchCard
              key={p.id}
              property={p}
              isSuperInterested={superInterestIds.includes(p.id)}
              canSuperInterest={canUseSuperInterest && !superInterestIds.includes(p.id)}
              onSuperInterest={() => addSuperInterest(p.id)}
              onWithdrawInterest={() => withdrawInterest(p.id)}
              onUnmatch={() => unmatchFromProperty(p.id)}
              tenantProfiles={tenantProfiles}
              onViewDetail={() => navigate(`/property/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  property,
  isSuperInterested,
  canSuperInterest,
  onSuperInterest,
  onWithdrawInterest,
  onUnmatch,
  tenantProfiles,
  onViewDetail,
}: {
  property: Property;
  isSuperInterested: boolean;
  canSuperInterest: boolean;
  onSuperInterest: () => void;
  onWithdrawInterest: () => void;
  onUnmatch: () => void;
  tenantProfiles: TenantProfile[];
  onViewDetail: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const matchedProfiles = tenantProfiles.filter((t) => property.matchedTenants.includes(t.id));
  const interestedCount = Math.max(property.interestedTenants.length, 1);
  const effectivePrice = (property.weeklyPrice / interestedCount).toFixed(0);
  const minPrice = (property.weeklyPrice / property.maxTenants).toFixed(0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex cursor-pointer" onClick={onViewDetail}>
        <div className="w-28 h-28 shrink-0">
          <ImageWithFallback src={property.images[0]} alt={property.address} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-[0.75rem] text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" /> {property.address}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-[1.25rem]" style={{ fontWeight: 700 }}>${effectivePrice}</span>
              <span className="text-[0.7rem] text-muted-foreground">/wk</span>
              <span className="text-[0.65rem] text-muted-foreground">(min ${minPrice})</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[0.75rem] text-muted-foreground">
                {property.matchedTenants.length}/{property.maxTenants} matched
              </span>
            </div>
            {/* Stacked avatars */}
            <div className="flex -space-x-2">
              {matchedProfiles.slice(0, 3).map((t) => (
                <div key={t.id} className="w-6 h-6 rounded-full border-2 border-card overflow-hidden">
                  <ImageWithFallback src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                </div>
              ))}
              {matchedProfiles.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[0.55rem] text-muted-foreground">
                  +{matchedProfiles.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="px-3 pb-3 space-y-2">
        <div className="flex gap-2">
          {!isSuperInterested && canSuperInterest && (
            <button
              onClick={onSuperInterest}
              className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white py-2 rounded-lg text-[0.8rem] flex items-center justify-center gap-1"
            >
              <Star className="w-3.5 h-3.5" /> Super Interest
            </button>
          )}
          {isSuperInterested && (
            <button
              onClick={onWithdrawInterest}
              className="flex-1 bg-amber-50 text-amber-600 py-2 rounded-lg text-[0.8rem] flex items-center justify-center gap-1 border border-amber-200 hover:bg-amber-100 transition"
            >
              <Undo2 className="w-3.5 h-3.5" /> Withdraw Interest
            </button>
          )}
          <button
            onClick={onViewDetail}
            className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg text-[0.8rem] flex items-center justify-center gap-1"
          >
            View details <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Unmatch toggle */}
        {!showActions ? (
          <button
            onClick={() => setShowActions(true)}
            className="w-full text-[0.75rem] text-muted-foreground hover:text-destructive transition py-1"
          >
            More options...
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-destructive/5 border border-destructive/20 rounded-lg p-2">
            <p className="flex-1 text-[0.75rem] text-destructive">Remove this property from your matches?</p>
            <button
              onClick={onUnmatch}
              className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-[0.75rem] flex items-center gap-1 shrink-0"
            >
              <XCircle className="w-3.5 h-3.5" /> Unmatch
            </button>
            <button
              onClick={() => setShowActions(false)}
              className="text-muted-foreground text-[0.75rem] px-2 py-1.5 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
