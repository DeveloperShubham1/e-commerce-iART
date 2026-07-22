import React, { useState } from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

// ---------------------------------------------------------------------------
// Country data: dial code + expected national phone number length (digits,
// excluding the dial code / leading 0). Most countries have a fixed length;
// a few (Germany, Brazil, Indonesia, Italy...) genuinely vary, so those use
// a { min, max } range instead of a single number.
//
// This is a curated common-country list, not exhaustive. For airtight,
// production-grade validation across every country/carrier, swap this for
// `libphonenumber-js` (`isValidPhoneNumber(phone, countryIso)`), which
// encodes the real numbering plans. This approach is a solid, dependency-
// free middle ground for a checkout form.
// ---------------------------------------------------------------------------
const COUNTRIES = [
  { name: "India", dialCode: "+91", length: 10 },
  { name: "United States", dialCode: "+1", length: 10 },
  { name: "Canada", dialCode: "+1", length: 10 },
  { name: "United Kingdom", dialCode: "+44", length: 10 },
  { name: "Australia", dialCode: "+61", length: 9 },
  { name: "New Zealand", dialCode: "+64", length: { min: 8, max: 9 } },
  { name: "Germany", dialCode: "+49", length: { min: 10, max: 11 } },
  { name: "France", dialCode: "+33", length: 9 },
  { name: "Italy", dialCode: "+39", length: { min: 9, max: 10 } },
  { name: "Spain", dialCode: "+34", length: 9 },
  { name: "Netherlands", dialCode: "+31", length: 9 },
  { name: "Belgium", dialCode: "+32", length: 9 },
  { name: "Switzerland", dialCode: "+41", length: 9 },
  { name: "Ireland", dialCode: "+353", length: 9 },
  { name: "Portugal", dialCode: "+351", length: 9 },
  { name: "Sweden", dialCode: "+46", length: { min: 7, max: 9 } },
  { name: "Norway", dialCode: "+47", length: 8 },
  { name: "Denmark", dialCode: "+45", length: 8 },
  { name: "Poland", dialCode: "+48", length: 9 },
  { name: "Russia", dialCode: "+7", length: 10 },
  { name: "UAE", dialCode: "+971", length: 9 },
  { name: "Saudi Arabia", dialCode: "+966", length: 9 },
  { name: "Qatar", dialCode: "+974", length: 8 },
  { name: "Kuwait", dialCode: "+965", length: 8 },
  { name: "Israel", dialCode: "+972", length: 9 },
  { name: "Turkey", dialCode: "+90", length: 10 },
  { name: "Pakistan", dialCode: "+92", length: 10 },
  { name: "Bangladesh", dialCode: "+880", length: 10 },
  { name: "Nepal", dialCode: "+977", length: 10 },
  { name: "Sri Lanka", dialCode: "+94", length: 9 },
  { name: "China", dialCode: "+86", length: 11 },
  { name: "Japan", dialCode: "+81", length: 10 },
  { name: "South Korea", dialCode: "+82", length: { min: 9, max: 10 } },
  { name: "Singapore", dialCode: "+65", length: 8 },
  { name: "Malaysia", dialCode: "+60", length: { min: 9, max: 10 } },
  { name: "Indonesia", dialCode: "+62", length: { min: 9, max: 12 } },
  { name: "Thailand", dialCode: "+66", length: 9 },
  { name: "Vietnam", dialCode: "+84", length: 9 },
  { name: "Philippines", dialCode: "+63", length: 10 },
  { name: "Hong Kong", dialCode: "+852", length: 8 },
  { name: "South Africa", dialCode: "+27", length: 9 },
  { name: "Nigeria", dialCode: "+234", length: 10 },
  { name: "Kenya", dialCode: "+254", length: 9 },
  { name: "Egypt", dialCode: "+20", length: 10 },
  { name: "Brazil", dialCode: "+55", length: { min: 10, max: 11 } },
  { name: "Mexico", dialCode: "+52", length: 10 },
  { name: "Argentina", dialCode: "+54", length: { min: 10, max: 11 } },
];

// Fallback used for any country not in the list above.
const DEFAULT_PHONE_LENGTH = { min: 7, max: 15 };

const getPhoneLength = (countryName) => {
  const country = COUNTRIES.find((c) => c.name === countryName);
  if (!country) return DEFAULT_PHONE_LENGTH;
  return typeof country.length === "number"
    ? { min: country.length, max: country.length }
    : country.length;
};

const formatLengthHint = ({ min, max }) =>
  min === max ? `${min} digits` : `${min}–${max} digits`;

// ---------------------------------------------------------------------------
// Input Field Component
// ---------------------------------------------------------------------------
const InputField = ({
  type,
  placeholder,
  name,
  handleChange,
  address,
  maxLength,
  error,
}) => {
  const onChangeHandler = (e) => {
    let value = e.target.value;

    if (type === "number") {
      // Allow only digits
      value = value.replace(/\D/g, "");
      if (maxLength) value = value.slice(0, maxLength);
      e.target.value = value;
    }

    handleChange(e);
  };

  return (
    <div className="w-full">
      <input
        className={`w-full px-2 py-2.5 border rounded outline-none text-gray-500 transition ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-gray-500/30 focus:border-primary"
        }`}
        type="text" // Use text instead of number so we control formatting
        inputMode={type === "number" ? "numeric" : undefined}
        pattern={type === "number" ? "[0-9]*" : undefined}
        placeholder={placeholder}
        name={name}
        value={address[name]}
        required
        maxLength={maxLength}
        onChange={onChangeHandler}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Country Select Component
// ---------------------------------------------------------------------------
const CountrySelect = ({ address, handleChange }) => (
  <select
    className="w-full px-2 py-2.5 border border-gray-500/30 rounded outline-none text-gray-500 focus:border-primary transition bg-white"
    name="country"
    value={address.country}
    required
    onChange={handleChange}
  >
    <option value="" disabled>
      Select Country
    </option>
    {COUNTRIES.map((c) => (
      <option key={c.name} value={c.name}>
        {c.name} ({c.dialCode})
      </option>
    ))}
  </select>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const AddAddress = () => {
  const { axios, user, navigate } = useAppContext();

  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
    landmark: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setAddress((prevAddress) => ({
      ...prevAddress,
      [name]: value,
    }));

    // Clear a field's error as soon as the user edits it again
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const phoneLength = getPhoneLength(address.country);

  const validate = () => {
    const newErrors = {};

    if (!address.country) {
      newErrors.country = "Please select a country";
    }

    const digits = address.phone.length;
    if (!address.country) {
      // can't validate phone length without a country yet
      if (digits === 0) newErrors.phone = "WhatsApp number is required";
    } else if (digits < phoneLength.min || digits > phoneLength.max) {
      newErrors.phone = `Enter a valid ${address.country} number (${formatLengthHint(
        phoneLength
      )})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    try {
      const { data } = await axios.post("/api/address/add", { address });

      if (data.success) {
        toast.success(data.message);
        navigate(-1);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className=" mx-10 mt-16 pb-16">
      <p className="text-2xl md:text-3xl text-gray-500">
        Add Shipping <span className="font-semibold text-primary">Address</span>
      </p>
      <div className="flex flex-col-reverse md:flex-row justify-between mt-10">
        <div className="flex-1 max-w-md">
          <form onSubmit={onSubmitHandler} className="space-y-3 mt-6 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                handleChange={handleChange}
                address={address}
                name="firstName"
                type="text"
                placeholder="First Name"
              />
              <InputField
                handleChange={handleChange}
                address={address}
                name="lastName"
                type="text"
                placeholder="Last Name"
              />
            </div>

            <InputField
              handleChange={handleChange}
              address={address}
              name="email"
              type="email"
              placeholder="Email address"
            />
            <InputField
              handleChange={handleChange}
              address={address}
              name="street"
              type="text"
              placeholder="Street"
            />

            <InputField
              handleChange={handleChange}
              address={address}
              name="landmark"
              type="text"
              placeholder="Landmark"
            />

            <div className="grid grid-cols-2 gap-4">
              <InputField
                handleChange={handleChange}
                address={address}
                name="city"
                type="text"
                placeholder="City"
              />
              <InputField
                handleChange={handleChange}
                address={address}
                name="state"
                type="text"
                placeholder="State"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                handleChange={handleChange}
                address={address}
                name="zipcode"
                type="number"
                placeholder="Pin code"
                maxLength={10}
              />
              <div className="w-full">
                <CountrySelect address={address} handleChange={handleChange} />
                {errors.country && (
                  <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                )}
              </div>
            </div>

            <InputField
              handleChange={handleChange}
              address={address}
              name="phone"
              type="number"
              placeholder={
                address.country
                  ? `WhatsApp Number (${formatLengthHint(phoneLength)})`
                  : "WhatsApp Number"
              }
              maxLength={phoneLength.max}
              error={errors.phone}
            />

            <p className="mt-2 text-xs text-gray-500">
              <strong>Note:</strong> Please enter the mobile number linked to your WhatsApp
              account. All order confirmations, shipping updates, and delivery notifications
              will be sent to this number.
            </p>

            <button className="w-full mt-6 bg-primary text-white py-3 hover:bg-primary-dull transition cursor-pointer uppercase">
              Save address
            </button>
          </form>
        </div>
        <img
          className="md:mr-16 mb-16 md:mt-0"
          src={assets.add_address_iamge}
          alt="Add Address"
        />
      </div>
    </div>
  );
};

export default AddAddress;