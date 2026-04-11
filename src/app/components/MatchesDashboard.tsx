import { useState, useEffect } from "react";
import { useApp, Property, TenantProfile } from "../store";
import { useNavigate } from "react-router";
import { Heart, Star, Users, MapPin, ChevronRight, XCircle, Undo2, Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api } from "../../lib/api";

export function MatchesDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileCache, setProfileCache] = useState<Record<string, TenantProfile>>({});

  const fetchMatches = async () => {
    if (!user) return;
    try {
      const all = await api.get<Property[]>("/properties/");
      const matched = all.filter(
        (p) =>
          p.interested_user_ids?.includes(user.id) ||
          p.approved_user_ids?.includes(user.id)
      );
      matched.sort((a, b) => {
        const aCount = Math.max(a.interested_user_ids?.length || 0, 1);
        const bCount = Math.max(b.interested_user_ids?.length || 0, 1);
        return a.price / aCount - b.price / bCount;
      });
      setProperties(matched);

      const userIds = new Set<string>();
      matched.forEach((p) => {
        p.approved_user_ids?.forEach((id) => userIds.add(id));
      });
      userIds.delete(user.id);

      const profiles: Record<string, TenantProfile> = {};
      await Promise.allSettled(
        [...userIds].map(async (id) => {
          const profile = await api.get<TenantProfile>(`/users/${id}`);
          profiles[id] = profile;
        })
      );
      setProfileCache(profiles);
    } catch (err) {
      console.error("Fetch matches error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [user]);

  const handleSuperLike = async (propertyId: string) => {
    try {
      await api.post(`/properties/${propertyId}/super-like`);
      fetchMatches();
    } catch (err: any) {
      console.error("Super like error:", err);
      alert(err.message || "Cannot super-like right now. You may need to wait 24 hours.");
    }
  };

  const handleWithdraw = async (propertyId: string) => {
    try {
      await api.post(`/properties/${propertyId}/withdraw`);
      fetchMatches();
    } catch (err) {
      console.error("Withdraw error:", err);
    }
  };

  const handleRemoveInterest = async (propertyId: string) => {
    try {
      await api.del(`/properties/${propertyId}/interest`);
      fetchMatches();
    } catch (err) {
      console.error("Remove interest error:", err);
    }
  };

  const now = Date.now();
  const getArchiveStatus = (p: Property) => {
    const expiryMs = new Date(p.expiry_date).getTime();
    const isSuperLiked = p.super_liked_by_me;
    if (isSuperLiked && now > expiryMs + 31 * 24 * 60 * 60 * 1000) return "archived";
    if (!isSuperLiked && now > expiryMs + 14 * 24 * 60 * 60 * 1000) return "archived";
    return "active";
  };

  const activeMatches = properties.filter((p) => getArchiveStatus(p) !== "archived");

  if (loading) {
    return (
      <div className="px-4 pt-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground text-sm">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2>Your Matches</h2>
        <div className="flex items-center gap-1 text-[0.75rem] text-muted-foreground">
          <Star className="w-3.5 h-3.5" />
          <span className="text-primary">Super Interest</span>
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
              isSuperLiked={p.super_liked_by_me}
              onSuperLike={() => handleSuperLike(p.id)}
              onWithdraw={() => handleWithdraw(p.id)}
              onRemoveInterest={() => handleRemoveInterest(p.id)}
              profileCache={profileCache}
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
  isSuperLiked,
  onSuperLike,
  onWithdraw,
  onRemoveInterest,
  profileCache,
  onViewDetail,
}: {
  property: Property;
  isSuperLiked: boolean;
  onSuperLike: () => void;
  onWithdraw: () => void;
  onRemoveInterest: () => void;
  profileCache: Record<string, TenantProfile>;
  onViewDetail: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const matchedProfiles = (property.approved_user_ids || [])
    .map((id) => profileCache[id])
    .filter(Boolean);
  const interestedCount = Math.max(property.interested_user_ids?.length || 0, 1);
  const effectivePrice = (property.price / interestedCount).toFixed(0);
  const minPrice = (property.price / property.max_tenants).toFixed(0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex cursor-pointer" onClick={onViewDetail}>
        <div className="w-28 h-28 shrink-0">
          <ImageWithFallback
            src={property.images?.[0] || "https://images.unsplash.com/photo-1559329146-807aff9ff1fb?q=80&w=1080"}
            alt={property.address}
            className="w-full h-full object-cover"
          />
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
                {property.current_tenants}/{property.max_tenants} matched
              </span>
            </div>
            <div className="flex -space-x-2">
              {matchedProfiles.slice(0, 3).map((t) => (
                <div key={t.id} className="w-6 h-6 rounded-full border-2 border-card overflow-hidden">
                  <ImageWithFallback
                    src={t.profile_image_url || ""}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
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

      <div className="px-3 pb-3 space-y-2">
        <div className="flex gap-2">
          {!isSuperLiked && (
            <button
              onClick={onSuperLike}
              className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white py-2 rounded-lg text-[0.8rem] flex items-center justify-center gap-1"
            >
              <Star className="w-3.5 h-3.5" /> Super Interest
            </button>
          )}
          {isSuperLiked && (
            <button
              onClick={onWithdraw}
              className="flex-1 bg-amber-50 text-amber-600 py-2 rounded-lg text-[0.8rem] flex items-center justify-center gap-1 border border-amber-200 hover:bg-amber-100 transition"
            >
              <Undo2 className="w-3.5 h-3.5" /> Withdraw
            </button>
          )}
          <button
            onClick={onViewDetail}
            className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg text-[0.8rem] flex items-center justify-center gap-1"
          >
            View details <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!showActions ? (
          <button
            onClick={() => setShowActions(true)}
            className="w-full text-[0.75rem] text-muted-foreground hover:text-destructive transition py-1"
          >
            More options...
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-destructive/5 border border-destructive/20 rounded-lg p-2">
            <p className="flex-1 text-[0.75rem] text-destructive">Remove from matches?</p>
            <button
              onClick={onRemoveInterest}
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
