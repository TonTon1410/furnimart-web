import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useToast } from "@/context/ToastContext";

// Fix icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Province {
  code: number;
  name: string;
  districts: District[];
}
interface District {
  code: number;
  name: string;
  wards: Ward[];
}
interface Ward {
  code: number;
  name: string;
}

export interface Address {
  city: string;
  district: string;
  ward: string;
  latitude?: number;
  longitude?: number;
}

type Props = {
  value?: Address;
  onChange: (val: Address) => void;
  className?: string;
};

// Marker chọn bằng click
const LocationMarker = React.memo(
  ({ onSelect }: { onSelect: (lat: number, lng: number) => void }) => {
    const [position, setPosition] = useState<[number, number] | null>(null);

    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onSelect(e.latlng.lat, e.latlng.lng);
      },
    });

    return position ? <Marker position={position} /> : null;
  }
);

// Recenter map
const RecenterMap = React.memo(({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);
  return null;
});

const AddressSelector: React.FC<Props> = ({ value, onChange, className }) => {
  const { showToast } = useToast();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const [lat, setLat] = useState<number>(value?.latitude ?? 21.0278);
  const [lng, setLng] = useState<number>(value?.longitude ?? 105.8342);

  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-200";
  const selectClass =
    "mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm " +
    "text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

  // load tỉnh/thành - sử dụng GitHub raw data làm nguồn chính
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        // Use GitHub raw data (more reliable than provinces.open-api.vn)
        const res = await axios.get<
          Array<{
            Id: string;
            Name: string;
            Districts: Array<{
              Id: string;
              Name: string;
              Wards: Array<{ Id: string; Name: string }>;
            }>;
          }>
        >(
          "https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json"
        );
        // Transform to our format
        const provincesData = res.data.map((province) => ({
          code: parseInt(province.Id),
          name: province.Name,
          districts: province.Districts.map((district) => ({
            code: parseInt(district.Id),
            name: district.Name,
            wards: district.Wards.map((ward) => ({
              code: parseInt(ward.Id),
              name: ward.Name,
            })),
          })),
        }));
        setProvinces(provincesData);
      } catch (error) {
        console.error("Failed to load provinces:", error);
        showToast({
          type: "error",
          title: "Không thể tải dữ liệu tỉnh/thành. Vui lòng thử lại sau.",
        });
      }
    };

    fetchProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // đồng bộ value
  useEffect(() => {
    if (!value || provinces.length === 0) return;

    const prov = provinces.find((p) => p.name === value.city) || null;
    setSelectedProvince(prov);

    if (prov) {
      const dist =
        prov.districts.find((d) => d.name === value.district) || null;
      setSelectedDistrict(dist);

      if (dist) {
        const ward = dist.wards.find((w) => w.name === value.ward) || null;
        setSelectedWard(ward);
      }
    }

    if (value.latitude && value.longitude) {
      setLat(value.latitude);
      setLng(value.longitude);
    }
  }, [value, provinces]);

  // geocode khi chọn xong ward/district/province
  useEffect(() => {
    const fetchGeocode = async () => {
      if (!selectedProvince) return;

      const clean = (s: string) =>
        s
          .replace(/^(Thành phố|Quận|Huyện|Thị xã|Phường|Xã|Thị trấn)\s+/g, "")
          .trim();

      let query = "";
      if (selectedProvince && selectedDistrict && selectedWard) {
        query = `${clean(selectedWard.name)}, ${clean(
          selectedDistrict.name
        )}, ${clean(selectedProvince.name)}, Việt Nam`;
      } else if (selectedProvince && selectedDistrict) {
        query = `${clean(selectedDistrict.name)}, ${clean(
          selectedProvince.name
        )}, Việt Nam`;
      } else if (selectedProvince) {
        query = `${clean(selectedProvince.name)}, Việt Nam`;
      }

      if (!query) return;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=VN&limit=1`
        );
        const data = await res.json();
        if (data.length > 0) {
          setLat(parseFloat(data[0].lat));
          setLng(parseFloat(data[0].lon));
        }
      } catch (e) {
        console.error("Lỗi geocode:", e);
      }
    };

    fetchGeocode();
  }, [selectedProvince, selectedDistrict, selectedWard]);

  // emit ra ngoài
  useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard) {
      onChange({
        city: selectedProvince.name,
        district: selectedDistrict.name,
        ward: selectedWard.name,
        latitude: lat,
        longitude: lng,
      });
    }
  }, [selectedProvince, selectedDistrict, selectedWard, lat, lng, onChange]);

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {/* Province */}
      <div>
        <label htmlFor="province" className={labelClass}>
          Tỉnh/Thành phố
        </label>
        <select
          id="province"
          value={selectedProvince?.code || ""}
          onChange={(e) => {
            const prov = provinces.find(
              (p) => p.code === Number(e.target.value)
            );
            setSelectedProvince(prov || null);
            setSelectedDistrict(null);
            setSelectedWard(null);
          }}
          className={selectClass}
        >
          <option value="">-- Chọn tỉnh/thành --</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      {selectedProvince && (
        <div>
          <label htmlFor="district" className={labelClass}>
            Quận/Huyện
          </label>
          <select
            id="district"
            value={selectedDistrict?.code || ""}
            onChange={(e) => {
              const dist = selectedProvince.districts.find(
                (d) => d.code === Number(e.target.value)
              );
              setSelectedDistrict(dist || null);
              setSelectedWard(null);
            }}
            className={selectClass}
          >
            <option value="">-- Chọn quận/huyện --</option>
            {selectedProvince.districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Ward */}
      {selectedDistrict && (
        <div>
          <label htmlFor="ward" className={labelClass}>
            Phường/Xã
          </label>
          <select
            id="ward"
            value={selectedWard?.code || ""}
            onChange={(e) => {
              const ward = selectedDistrict.wards.find(
                (w) => w.code === Number(e.target.value)
              );
              setSelectedWard(ward || null);
            }}
            className={selectClass}
          >
            <option value="">-- Chọn phường/xã --</option>
            {selectedDistrict.wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Map */}
      <div>
        <label className={labelClass}>Vị trí bản đồ</label>
        <div className="w-full h-72 mt-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} />
            <RecenterMap lat={lat} lng={lng} />
            <LocationMarker
              onSelect={(lat, lng) => {
                setLat(lat);
                setLng(lng);
              }}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default AddressSelector;
