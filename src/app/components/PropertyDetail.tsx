import { useParams, useNavigate } from "react-router";
import { useApp } from "../store";
import { ArrowLeft, Bed, Bath, Car, Users, MapPin, Calendar, MessageCircle, Phone, Undo2, XCircle, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";

export function PropertyDetail() {
  const { id } = useParams();
  const { properties, tenantProfiles, user, superInterests, canSuperInterest, addSuperInterest, withdrawInterest, unmatchFromProperty } = useApp();
  const navigate = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);

  const property = properties.find((p) => p.id === id);
  if (!property) {
    return (
      <div className="p-6 text-center">
        <p>Property not found.</p>
        <button onClick={() => navigate(-1)} className="text-primary mt-2">Go back</button>
      </div>
    );
  }

  const matchedProfiles = tenantProfiles.filter((t) => property.matchedTenants.includes(t.id));
  const interestedProfiles = tenantProfiles.filter((t) => property.interestedTenants.includes(t.id));
  const minPrice = (property.weeklyPrice / property.maxTenants).toFixed(0);
  const currentPrice = (property.weeklyPrice / Math.max(property.matchedTenants.length, 1)).toFixed(0);

  const superInterestIds = superInterests.map((s) => s.propertyId);
  const isSuperInterested = superInterestIds.includes(property.id);
  const canUseSuperInterest = canSuperInterest() && !isSuperInterested;

  // SMS group chat link (excluding landlord)
  const tenantPhones = interestedProfiles.map((t) => t.phone);
  const smsLink = `sms:${tenantPhones.join(",")}?body=Hey! We're all matched on ${property.address} via Dwllr. Let's chat about sharing!`;

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Image gallery */}
      <div className="relative aspect-[4/3]">
        <ImageWithFallback src={property.images[imgIdx]} alt={property.address} className="w-full h-full object-cover" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {property.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setImgIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === imgIdx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Address & price */}
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
            Total: ${property.weeklyPrice}/wk for entire property
          </p>
        </div>

        {/* Amenities */}
        <div className="flex gap-4">
          {[
            { icon: Bed, label: "Bedrooms", val: property.bedrooms },
            { icon: Bath, label: "Bathrooms", val: property.bathrooms },
            { icon: Car, label: "Garages", val: property.garages },
            { icon: Users, label: "Max tenants", val: property.maxTenants },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="flex-1 bg-muted/50 rounded-lg p-3 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-[1.1rem]" style={{ fontWeight: 600 }}>{val}</div>
              <div className="text-[0.65rem] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Occupancy */}
        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.85rem]">Occupancy</span>
            <span className="text-[0.85rem]" style={{ fontWeight: 600 }}>
              {property.matchedTenants.length} / {property.maxTenants}
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(property.matchedTenants.length / property.maxTenants) * 100}%` }}
            />
          </div>
        </div>

        {/* Expiry */}
        <div className="flex items-center gap-2 text-[0.85rem] text-muted-foreground">
          <Calendar className="w-4 h-4" />
          Listing expires: {new Date(property.expiryDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
        </div>

        {/* Tenant preferences */}
        {property.tenantPreferences.length > 0 && (
          <div>
            <h3 className="text-[0.9rem] mb-2">Landlord is looking for</h3>
            <div className="flex flex-wrap gap-1.5">
              {property.tenantPreferences.map((pref) => (
                <span key={pref} className="px-3 py-1 rounded-full bg-secondary text-primary text-[0.8rem]">
                  {pref}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Matched tenants */}
        <div>
          <h3 className="text-[0.9rem] mb-3">Matched Tenants ({matchedProfiles.length})</h3>
          <div className="space-y-3">
            {matchedProfiles.map((t) => (
              <div key={t.id} className="flex gap-3 bg-card rounded-xl border border-border p-3">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                  <ImageWithFallback src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.9rem]" style={{ fontWeight: 600 }}>{t.name}</span>
                    {property.interestedTenants.includes(t.id) && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[0.6rem] rounded-full" style={{ fontWeight: 600 }}>
                        Interested
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[0.8rem] truncate">{t.bio}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.traits.map((trait) => (
                      <span key={trait} className="px-2 py-0.5 bg-muted text-[0.65rem] rounded-full text-muted-foreground">{trait}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group chat button */}
        {user?.type === "tenant" && interestedProfiles.length > 0 && (
          <a
            href={smsLink}
            className="block w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-center hover:opacity-90 transition"
          >
            <span className="flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" /> Create group chat ({interestedProfiles.length} tenants)
            </span>
          </a>
        )}

        {/* Tenant actions: Super Interest, Withdraw, Unmatch */}
        {user?.type === "tenant" && (
          <div className="space-y-3 pt-1">
            {/* Super Interest / Withdraw Interest */}
            {!isSuperInterested && canUseSuperInterest && (
              <button
                onClick={() => addSuperInterest(property.id)}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" /> Express Super Interest
              </button>
            )}
            {isSuperInterested && (
              <button
                onClick={() => withdrawInterest(property.id)}
                className="w-full bg-amber-50 text-amber-700 border border-amber-200 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 transition"
              >
                <Undo2 className="w-5 h-5" /> Withdraw Super Interest
              </button>
            )}

            {/* Unmatch */}
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
                    onClick={() => {
                      unmatchFromProperty(property.id);
                      navigate("/matches");
                    }}
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