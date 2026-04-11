import { useParams, useNavigate } from "react-router";
import { useApp, Property, TenantProfile } from "../store";
import { ArrowLeft, Bed, Bath, Car, Users, MapPin, Calendar, MessageCircle, Undo2, XCircle, Star, UserPlus, UserMinus, Loader2, RefreshCw } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { api } from "../../lib/api";

export function PropertyDetail() {
  const { id } = useParams();
  const { user } = useApp();
  const navigate = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, TenantProfile>>({});
  const [landlordProfile, setLandlordProfile] = useState<TenantProfile | null>(null);

  const fetchProperty = async () => {
    try {
      const p = await api.get<Property>(`/properties/${id}`);
      setProperty(p);

      const userIds = new Set<string>();
      p.approved_user_ids?.forEach((uid) => userIds.add(uid));
      p.interested_user_ids?.forEach((uid) => userIds.add(uid));

      const profileMap: Record<string, TenantProfile> = {};
      await Promise.allSettled(
        [...userIds].map(async (uid) => {
          const profile = await api.get<TenantProfile>(`/users/${uid}`);
          profileMap[uid] = profile;
        })
      );
      setProfiles(profileMap);

      if (p.landlord_id) {
        try {
          const ll = await api.get<TenantProfile>(`/users/${p.landlord_id}`);
          setLandlordProfile(ll);
        } catch {}
      }
    } catch (err) {
      console.error("Property fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6 text-center">
        <p>Property not found.</p>
        <button onClick={() => navigate(-1)} className="text-primary mt-2">Go back</button>
      </div>
    );
  }

  const isLandlord = user?.role === "landlord" && user?.id === property.landlord_id;
  const isTenant = user?.role === "tenant";
  const approvedProfiles = (property.approved_user_ids || []).map((uid) => profiles[uid]).filter(Boolean);
  const interestedProfiles = (property.interested_user_ids || []).map((uid) => profiles[uid]).filter(Boolean);
  const minPrice = (property.price / property.max_tenants).toFixed(0);
  const currentPrice = (property.price / Math.max(property.current_tenants, 1)).toFixed(0);
  const isExpired = new Date(property.expiry_date) < new Date();

  const tenantPhones = interestedProfiles
    .filter((t) => t.id !== user?.id)
    .map((t) => t.phone)
    .filter(Boolean);
  const smsLink = `sms:${tenantPhones.join(",")}?body=Hey! We're all matched on ${property.address} via Dwllr. Let's chat about sharing!`;

  const handleSuperLike = async () => {
    try {
      await api.post(`/properties/${property.id}/super-like`);
      fetchProperty();
    } catch (err: any) {
      alert(err.message || "Cannot super-like right now.");
    }
  };

  const handleWithdraw = async () => {
    try {
      await api.post(`/properties/${property.id}/withdraw`);
      navigate("/matches");
    } catch (err) {
      console.error("Withdraw error:", err);
    }
  };

  const handleApprove = async (tenantId: string) => {
    try {
      await api.post(`/properties/${property.id}/approve/${tenantId}`);
      fetchProperty();
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  const handleRemoveTenant = async (tenantId: string) => {
    try {
      await api.post(`/properties/${property.id}/remove-tenant/${tenantId}`);
      fetchProperty();
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  const handleRefreshExpiry = async () => {
    try {
      await api.post(`/properties/${property.id}/refresh-expiry`);
      fetchProperty();
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="relative aspect-[4/3]">
        <ImageWithFallback
          src={property.images?.[imgIdx] || "https://images.unsplash.com/photo-1559329146-807aff9ff1fb?q=80&w=1080"}
          alt={property.address}
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {(property.images || []).map((_, i) => (
            <button
              key={i}
              onClick={() => setImgIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === imgIdx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        <div>
          <p className="text-muted-foreground text-[0.8rem] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {property.address}
          </p>
          <div className="flex items-baseline gap-3 mt-1">
            <div>
              <span className="text-[2rem]" style={{ fontWeight: 800 }}>${minPrice}</span>
              <span className="text-muted-foreground text-[0.8rem]">/wk min</span>
            </div>
            <div className="text-muted-foreground text-[0.85rem]">
              Current: <span style={{ fontWeight: 600 }} className="text-foreground">${currentPrice}/wk</span>
            </div>
          </div>
          <p className="text-muted-foreground text-[0.75rem] mt-1">
            Total: ${property.price}/wk for entire property
          </p>
        </div>

        {property.description && (
          <p className="text-[0.85rem] text-muted-foreground">{property.description}</p>
        )}

        <div className="flex gap-4">
          {[
            { icon: Bed, label: "Bedrooms", val: property.bedrooms },
            { icon: Bath, label: "Bathrooms", val: property.bathrooms },
            { icon: Car, label: "Garages", val: property.garages },
            { icon: Users, label: "Max tenants", val: property.max_tenants },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="flex-1 bg-muted/50 rounded-lg p-3 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-[1.1rem]" style={{ fontWeight: 600 }}>{val}</div>
              <div className="text-[0.65rem] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.85rem]">Occupancy</span>
            <span className="text-[0.85rem]" style={{ fontWeight: 600 }}>
              {property.current_tenants} / {property.max_tenants}
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(property.current_tenants / property.max_tenants) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[0.85rem] text-muted-foreground">
          <Calendar className="w-4 h-4" />
          Listing expires: {new Date(property.expiry_date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
          {isExpired && <span className="text-red-500 font-bold text-[0.75rem]">(Expired)</span>}
        </div>

        {property.tenant_preferences?.length > 0 && (
          <div>
            <h3 className="text-[0.9rem] mb-2">Landlord is looking for</h3>
            <div className="flex flex-wrap gap-1.5">
              {property.tenant_preferences.map((pref) => (
                <span key={pref} className="px-3 py-1 rounded-full bg-secondary text-primary text-[0.8rem]">
                  {pref}
                </span>
              ))}
            </div>
          </div>
        )}

        {landlordProfile && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-[0.9rem] mb-3">Landlord</h3>
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-muted">
                {landlordProfile.profile_image_url ? (
                  <ImageWithFallback src={landlordProfile.profile_image_url} alt={landlordProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
                    {landlordProfile.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p style={{ fontWeight: 600 }} className="text-[0.9rem]">{landlordProfile.name}</p>
                {landlordProfile.phone && (
                  <p className="text-muted-foreground text-[0.8rem]">{landlordProfile.phone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-[0.9rem] mb-3">
            {isLandlord ? "Tenants" : "Matched Tenants"} ({approvedProfiles.length})
          </h3>
          <div className="space-y-3">
            {approvedProfiles.map((t) => (
              <div key={t.id} className="flex gap-3 bg-card rounded-xl border border-border p-3">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-muted">
                  {t.profile_image_url ? (
                    <ImageWithFallback src={t.profile_image_url} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                      {t.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.9rem]" style={{ fontWeight: 600 }}>{t.name}</span>
                    {property.interested_user_ids?.includes(t.id) && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[0.6rem] rounded-full" style={{ fontWeight: 600 }}>
                        Interested
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[0.8rem] truncate">{t.bio}</p>
                  {isLandlord && (
                    <button
                      onClick={() => handleRemoveTenant(t.id)}
                      className="mt-1 text-destructive text-[0.75rem] flex items-center gap-1 hover:underline"
                    >
                      <UserMinus className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isLandlord && (property.interested_user_ids || []).filter((uid) => !property.approved_user_ids?.includes(uid)).length > 0 && (
          <div>
            <h3 className="text-[0.9rem] mb-3">Pending Interest ({(property.interested_user_ids || []).filter((uid) => !property.approved_user_ids?.includes(uid)).length})</h3>
            <div className="space-y-3">
              {(property.interested_user_ids || [])
                .filter((uid) => !property.approved_user_ids?.includes(uid))
                .map((uid) => profiles[uid])
                .filter(Boolean)
                .map((t) => (
                  <div key={t.id} className="flex gap-3 bg-card rounded-xl border border-border p-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-muted">
                      {t.profile_image_url ? (
                        <ImageWithFallback src={t.profile_image_url} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                          {t.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[0.9rem]" style={{ fontWeight: 600 }}>{t.name}</span>
                      <p className="text-muted-foreground text-[0.8rem] truncate">{t.bio}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleApprove(t.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-[0.75rem] font-bold hover:bg-green-200 transition"
                        >
                          <UserPlus className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleRemoveTenant(t.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-[0.75rem] font-bold hover:bg-red-200 transition"
                        >
                          <UserMinus className="w-3 h-3" /> Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {isLandlord && isExpired && (
          <button
            onClick={handleRefreshExpiry}
            className="w-full bg-amber-100 text-amber-700 py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-amber-200 transition"
          >
            <RefreshCw className="w-5 h-5" /> Reactivate Listing (+30 days)
          </button>
        )}

        {isTenant && tenantPhones.length > 0 && (
          <a
            href={smsLink}
            className="block w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-center hover:opacity-90 transition"
          >
            <span className="flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" /> Create group chat ({tenantPhones.length} tenants)
            </span>
          </a>
        )}

        {isTenant && (
          <div className="space-y-3 pt-1">
            {!property.super_liked_by_me && (
              <button
                onClick={handleSuperLike}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" /> Express Super Interest
              </button>
            )}
            {property.super_liked_by_me && (
              <button
                onClick={handleWithdraw}
                className="w-full bg-amber-50 text-amber-700 border border-amber-200 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 transition"
              >
                <Undo2 className="w-5 h-5" /> Withdraw Super Interest
              </button>
            )}

            {!confirmUnmatch ? (
              <button
                onClick={() => setConfirmUnmatch(true)}
                className="w-full text-[0.85rem] text-muted-foreground hover:text-destructive py-2 transition"
              >
                Unmatch from this property
              </button>
            ) : (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-3">
                <p className="text-[0.85rem] text-destructive">
                  Are you sure? You will be removed from this property's matched pool and any associated group chats.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleWithdraw}
                    className="flex-1 bg-destructive text-destructive-foreground py-2.5 rounded-lg flex items-center justify-center gap-1 text-[0.85rem]"
                  >
                    <XCircle className="w-4 h-4" /> Yes, unmatch
                  </button>
                  <button
                    onClick={() => setConfirmUnmatch(false)}
                    className="flex-1 bg-muted text-muted-foreground py-2.5 rounded-lg text-[0.85rem]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
