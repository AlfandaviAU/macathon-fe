import { useState, useEffect } from "react";
import { useApp, Property } from "../store";
import { useNavigate } from "react-router";
import { Plus, Bed, Bath, Users, MapPin, X, Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const API_URL = "http://127.0.0.1:8000";
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NTAxNjJkYy05YzJiLTQ3YjktYmFhNC04NDFhYzU4NjcxZTgiLCJyb2xlIjoibGFuZGxvcmQiLCJleHAiOjE3NzU5NTk0Mjd9.DDbfeIwmcSXLwg-Lw0FNvZjnFziAi3Bns8BbJs8EzDk"; // Your token

export function LandlordDashboard() {
  const { user, properties, setProperties } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Updated Mapper to handle your specific JSON fields
  const mapApiToProperty = (apiData: any): Property => ({
    id: apiData.id,
    landlordId: apiData.landlord_id,
    address: apiData.address,
    images: apiData.images?.length > 0 ? apiData.images : ["https://images.unsplash.com/photo-1559329146-807aff9ff1fb?q=80&w=1080"],
    bedrooms: apiData.bedrooms,
    bathrooms: apiData.bathrooms,
    garages: apiData.garages,
    weeklyPrice: apiData.price,
    currentTenants: apiData.current_tenants,
    maxTenants: apiData.max_tenants,
    expiryDate: apiData.expiry_date || "N/A",
    tenantPreferences: apiData.tenant_preferences || [],
    matchedTenants: apiData.approved_user_ids || [],
    interestedTenants: apiData.interested_user_ids || [],
    active: apiData.status === "available",
    // Adding extra data from your JSON
    occupancyRate: apiData.occupancy_rate,
    superLiked: apiData.super_liked_user_ids?.length > 0
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch(`${API_URL}/properties/`, {
          headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // console.log(data.map(mapApiToProperty))
          setProperties(data.map(mapApiToProperty));
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [setProperties]);

  // CRITICAL: Ensure user.id matches "850162dc-9c2b-47b9-baa4-841ac58671e8"
  const myProperties = properties.filter((p) => p.landlord_id === user?.id);

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading your portfolio...</div>;

  return (
      <div className="px-4 pt-4 max-w-lg mx-auto pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">My Listings ({myProperties.length})</h2>
          <button
              onClick={() => setShowForm(!showForm)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-[0.85rem] flex items-center gap-1.5"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "New listing"}
          </button>
        </div>

        <div className="space-y-3">
          {myProperties.map((p) => (
              <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors p-2"> {/* Added p-2 here for a 'gutter' around the image */}
                <div className="flex items-center gap-3"> {/* Added items-center and gap-3 */}
                  <div className="w-28 h-28 shrink-0 relative">
                    <ImageWithFallback
                        src={p.images[0]}
                        alt={p.address}
                        className="w-full h-full object-cover rounded-xl"
                    />
                    {(p as any).superLiked && (
                        <div className="absolute top-1 left-1 bg-orange-500 text-white p-1 rounded-full shadow-sm">
                          <Heart className="w-3 h-3 fill-current" />
                        </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 py-1"> {/* Removed p-3, replaced with py-1 for better vertical centering */}
                    <div className="flex items-start justify-between">
                      <p className="text-[0.8rem] truncate flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" /> {p.address}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-bold ${
                          p.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                      }`}>
          {p.active ? "Available" : "Draft"}
        </span>
                    </div>

                    <p className="text-[1.1rem] mt-0.5 font-bold">
                      ${p.weeklyPrice}<span className="text-[0.75rem] text-muted-foreground font-normal">/wk</span>
                    </p>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex gap-3 text-[0.75rem] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Bed className="w-3.5 h-3.5" />{p.bedrooms}</span>
                        <span className="flex items-center gap-0.5"><Bath className="w-3.5 h-3.5" />{p.bathrooms}</span>
                        <span className="flex items-center gap-0.5"><Users className="w-3.5 h-3.5" />{p.currentTenants}/{p.maxTenants}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3"> {/* Margin top instead of padding bottom to separate from the image row */}
                  <button
                      onClick={() => navigate(`/property/${p.id}`)}
                      className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded-lg text-[0.8rem] font-medium transition-colors"
                  >
                    Manage Listing
                  </button>
                </div>
              </div>
          ))}

          {myProperties.length === 0 && !showForm && (
              <div className="bg-muted/30 border border-dashed border-border rounded-2xl py-12 text-center">
                <p className="text-muted-foreground text-sm">No listings found for your ID.</p>
                <p className="text-[0.7rem] text-muted-foreground/60 mt-1">ID: {user?.id || 'Not Logged In'}</p>
              </div>
          )}
        </div>
      </div>
  );
}