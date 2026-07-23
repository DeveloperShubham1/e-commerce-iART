// import React, { useState } from "react";
// import { assets } from "../assets/assets";
// import { useAppContext } from "../context/AppContext";
// import { toast } from "react-toastify";

// // ---------------------------------------------------------------------------
// // Country data: dial code + expected national phone number length (digits,
// // excluding the dial code / leading 0). Most countries have a fixed length;
// // a few (Germany, Brazil, Indonesia, Italy...) genuinely vary, so those use
// // a { min, max } range instead of a single number.
// //
// // This is a curated common-country list, not exhaustive. For airtight,
// // production-grade validation across every country/carrier, swap this for
// // `libphonenumber-js` (`isValidPhoneNumber(phone, countryIso)`), which
// // encodes the real numbering plans. This approach is a solid, dependency-
// // free middle ground for a checkout form.
// // ---------------------------------------------------------------------------
// const COUNTRIES = [
//   { name: "India", dialCode: "+91", length: 10 },
//   { name: "United States", dialCode: "+1", length: 10 },
//   { name: "Canada", dialCode: "+1", length: 10 },
//   { name: "United Kingdom", dialCode: "+44", length: 10 },
//   { name: "Australia", dialCode: "+61", length: 9 },
//   { name: "New Zealand", dialCode: "+64", length: { min: 8, max: 9 } },
//   { name: "Germany", dialCode: "+49", length: { min: 10, max: 11 } },
//   { name: "France", dialCode: "+33", length: 9 },
//   { name: "Italy", dialCode: "+39", length: { min: 9, max: 10 } },
//   { name: "Spain", dialCode: "+34", length: 9 },
//   { name: "Netherlands", dialCode: "+31", length: 9 },
//   { name: "Belgium", dialCode: "+32", length: 9 },
//   { name: "Switzerland", dialCode: "+41", length: 9 },
//   { name: "Ireland", dialCode: "+353", length: 9 },
//   { name: "Portugal", dialCode: "+351", length: 9 },
//   { name: "Sweden", dialCode: "+46", length: { min: 7, max: 9 } },
//   { name: "Norway", dialCode: "+47", length: 8 },
//   { name: "Denmark", dialCode: "+45", length: 8 },
//   { name: "Poland", dialCode: "+48", length: 9 },
//   { name: "Russia", dialCode: "+7", length: 10 },
//   { name: "UAE", dialCode: "+971", length: 9 },
//   { name: "Saudi Arabia", dialCode: "+966", length: 9 },
//   { name: "Qatar", dialCode: "+974", length: 8 },
//   { name: "Kuwait", dialCode: "+965", length: 8 },
//   { name: "Israel", dialCode: "+972", length: 9 },
//   { name: "Turkey", dialCode: "+90", length: 10 },
//   { name: "Pakistan", dialCode: "+92", length: 10 },
//   { name: "Bangladesh", dialCode: "+880", length: 10 },
//   { name: "Nepal", dialCode: "+977", length: 10 },
//   { name: "Sri Lanka", dialCode: "+94", length: 9 },
//   { name: "China", dialCode: "+86", length: 11 },
//   { name: "Japan", dialCode: "+81", length: 10 },
//   { name: "South Korea", dialCode: "+82", length: { min: 9, max: 10 } },
//   { name: "Singapore", dialCode: "+65", length: 8 },
//   { name: "Malaysia", dialCode: "+60", length: { min: 9, max: 10 } },
//   { name: "Indonesia", dialCode: "+62", length: { min: 9, max: 12 } },
//   { name: "Thailand", dialCode: "+66", length: 9 },
//   { name: "Vietnam", dialCode: "+84", length: 9 },
//   { name: "Philippines", dialCode: "+63", length: 10 },
//   { name: "Hong Kong", dialCode: "+852", length: 8 },
//   { name: "South Africa", dialCode: "+27", length: 9 },
//   { name: "Nigeria", dialCode: "+234", length: 10 },
//   { name: "Kenya", dialCode: "+254", length: 9 },
//   { name: "Egypt", dialCode: "+20", length: 10 },
//   { name: "Brazil", dialCode: "+55", length: { min: 10, max: 11 } },
//   { name: "Mexico", dialCode: "+52", length: 10 },
//   { name: "Argentina", dialCode: "+54", length: { min: 10, max: 11 } },
// ];

// // Fallback used for any country not in the list above.
// const DEFAULT_PHONE_LENGTH = { min: 7, max: 15 };

// const getPhoneLength = (countryName) => {
//   const country = COUNTRIES.find((c) => c.name === countryName);
//   if (!country) return DEFAULT_PHONE_LENGTH;
//   return typeof country.length === "number"
//     ? { min: country.length, max: country.length }
//     : country.length;
// };

// const formatLengthHint = ({ min, max }) =>
//   min === max ? `${min} digits` : `${min}–${max} digits`;

// // ---------------------------------------------------------------------------
// // Input Field Component
// // ---------------------------------------------------------------------------
// const InputField = ({
//   type,
//   placeholder,
//   name,
//   handleChange,
//   address,
//   maxLength,
//   error,
// }) => {
//   const onChangeHandler = (e) => {
//     let value = e.target.value;

//     if (type === "number") {
//       // Allow only digits
//       value = value.replace(/\D/g, "");
//       if (maxLength) value = value.slice(0, maxLength);
//       e.target.value = value;
//     }

//     handleChange(e);
//   };

//   return (
//     <div className="w-full">
//       <input
//         className={`w-full px-2 py-2.5 border rounded outline-none text-gray-500 transition ${
//           error
//             ? "border-red-500 focus:border-red-500"
//             : "border-gray-500/30 focus:border-primary"
//         }`}
//         type="text" // Use text instead of number so we control formatting
//         inputMode={type === "number" ? "numeric" : undefined}
//         pattern={type === "number" ? "[0-9]*" : undefined}
//         placeholder={placeholder}
//         name={name}
//         value={address[name]}
//         required
//         maxLength={maxLength}
//         onChange={onChangeHandler}
//       />
//       {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
//     </div>
//   );
// };

// // ---------------------------------------------------------------------------
// // Country Select Component
// // ---------------------------------------------------------------------------
// const CountrySelect = ({ address, handleChange }) => (
//   <select
//     className="w-full px-2 py-2.5 border border-gray-500/30 rounded outline-none text-gray-500 focus:border-primary transition bg-white"
//     name="country"
//     value={address.country}
//     required
//     onChange={handleChange}
//   >
//     <option value="" disabled>
//       Select Country
//     </option>
//     {COUNTRIES.map((c) => (
//       <option key={c.name} value={c.name}>
//         {c.name} ({c.dialCode})
//       </option>
//     ))}
//   </select>
// );

// // ---------------------------------------------------------------------------
// // Main Component
// // ---------------------------------------------------------------------------
// const AddAddress = () => {
//   const { axios, user, navigate } = useAppContext();

//   const [address, setAddress] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     street: "",
//     city: "",
//     state: "",
//     zipcode: "",
//     country: "",
//     phone: "",
//     landmark: "",
//   });

//   const [errors, setErrors] = useState({});

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setAddress((prevAddress) => ({
//       ...prevAddress,
//       [name]: value,
//     }));

//     // Clear a field's error as soon as the user edits it again
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   const phoneLength = getPhoneLength(address.country);

//   const validate = () => {
//     const newErrors = {};

//     if (!address.country) {
//       newErrors.country = "Please select a country";
//     }

//     const digits = address.phone.length;
//     if (!address.country) {
//       // can't validate phone length without a country yet
//       if (digits === 0) newErrors.phone = "WhatsApp number is required";
//     } else if (digits < phoneLength.min || digits > phoneLength.max) {
//       newErrors.phone = `Enter a valid ${address.country} number (${formatLengthHint(
//         phoneLength
//       )})`;
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const onSubmitHandler = async (e) => {
//     e.preventDefault();

//     if (!validate()) {
//       toast.error("Please fix the highlighted fields");
//       return;
//     }

//     try {
//       const { data } = await axios.post("/api/address/add", { address });

//       if (data.success) {
//         toast.success(data.message);
//         navigate(-1);
//       } else {
//         toast.error(data.message);
//       }
//     } catch (error) {
//       toast.error(error.message);
//     }
//   };

//   return (
//     <div className="mt-16 pb-16">
//       <p className="text-2xl md:text-3xl text-gray-500">
//         Add Shipping <span className="font-semibold text-primary">Address</span>
//       </p>
//       <div className="flex flex-col-reverse md:flex-row justify-between mt-10">
//         <div className="flex-1 max-w-md">
//           <form onSubmit={onSubmitHandler} className="space-y-3 mt-6 text-sm">
//             <div className="grid grid-cols-2 gap-4">
//               <InputField
//                 handleChange={handleChange}
//                 address={address}
//                 name="firstName"
//                 type="text"
//                 placeholder="First Name"
//               />
//               <InputField
//                 handleChange={handleChange}
//                 address={address}
//                 name="lastName"
//                 type="text"
//                 placeholder="Last Name"
//               />
//             </div>

//             <InputField
//               handleChange={handleChange}
//               address={address}
//               name="email"
//               type="email"
//               placeholder="Email address"
//             />
//             <InputField
//               handleChange={handleChange}
//               address={address}
//               name="street"
//               type="text"
//               placeholder="Street"
//             />

//             <InputField
//               handleChange={handleChange}
//               address={address}
//               name="landmark"
//               type="text"
//               placeholder="Landmark"
//             />

//             <div className="grid grid-cols-2 gap-4">
//               <InputField
//                 handleChange={handleChange}
//                 address={address}
//                 name="city"
//                 type="text"
//                 placeholder="City"
//               />
//               <InputField
//                 handleChange={handleChange}
//                 address={address}
//                 name="state"
//                 type="text"
//                 placeholder="State"
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <InputField
//                 handleChange={handleChange}
//                 address={address}
//                 name="zipcode"
//                 type="number"
//                 placeholder="Pin code"
//                 maxLength={10}
//               />
//               <div className="w-full">
//                 <CountrySelect address={address} handleChange={handleChange} />
//                 {errors.country && (
//                   <p className="text-red-500 text-xs mt-1">{errors.country}</p>
//                 )}
//               </div>
//             </div>

//             <InputField
//               handleChange={handleChange}
//               address={address}
//               name="phone"
//               type="number"
//               placeholder={
//                 address.country
//                   ? `WhatsApp Number (${formatLengthHint(phoneLength)})`
//                   : "WhatsApp Number"
//               }
//               maxLength={phoneLength.max}
//               error={errors.phone}
//             />

//             <p className="mt-2 text-xs text-gray-500">
//               <strong>Note:</strong> Please enter the mobile number linked to your WhatsApp
//               account. All order confirmations, shipping updates, and delivery notifications
//               will be sent to this number.
//             </p>

//             <button className="w-full mt-6 bg-primary text-white py-3 hover:bg-primary-dull transition cursor-pointer uppercase">
//               Save address
//             </button>
//           </form>
//         </div>
//         <img
//           className="md:mr-16 mb-16 md:mt-0"
//           src={assets.add_address_iamge}
//           alt="Add Address"
//         />
//       </div>
//     </div>
//   );
// };

// export default AddAddress;




import React, { useState } from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

// ---------------------------------------------------------------------------
// Country data (Cleaned without flags)
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
// Floating Label Input Component
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
      value = value.replace(/\D/g, "");
      if (maxLength) value = value.slice(0, maxLength);
      e.target.value = value;
    }

    handleChange(e);
  };

  const hasValue = address[name] && address[name].toString().length > 0;

  return (
    <div className="relative w-full group">
      <input
        id={name}
        className={`peer w-full px-4 pt-6 pb-2 bg-slate-50 border rounded-xl text-slate-900 text-sm font-medium outline-none transition-all duration-200 ${error
            ? "border-rose-500 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            : "border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
          }`}
        type="text"
        inputMode={type === "number" ? "numeric" : undefined}
        pattern={type === "number" ? "[0-9]*" : undefined}
        placeholder=" "
        name={name}
        value={address[name]}
        required
        maxLength={maxLength}
        onChange={onChangeHandler}
      />
      <label
        htmlFor={name}
        className={`absolute left-4 pointer-events-none transition-all duration-200 text-xs font-semibold uppercase tracking-wider ${hasValue
            ? "top-1.5 text-indigo-600 font-bold"
            : "top-4 text-slate-400 peer-focus:top-1.5 peer-focus:text-indigo-600 peer-focus:font-bold"
          }`}
      >
        {placeholder}
      </label>
      {error && (
        <p className="text-rose-500 text-xs mt-1 ml-1 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {error}
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Country Select Component (Clean Display)
// ---------------------------------------------------------------------------
const CountrySelect = ({ address, handleChange }) => (
  <div className="relative w-full">
    <select
      id="country"
      name="country"
      value={address.country}
      required
      onChange={handleChange}
      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 text-sm font-medium hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all duration-200 cursor-pointer appearance-none"
    >
      <option value="" disabled>
        Country
      </option>

      {COUNTRIES.map((c) => (
        <option key={c.name} value={c.name}>
          {c.name} ({c.dialCode})
        </option>
      ))}
    </select>

    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  </div>
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
      toast.error("Please fill in all required fields accurately");
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
    <div className="min-h-screen bg-white text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-slate-900 selection:text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-left">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Shipping Information
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-3">
            Add Delivery Address
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Please enter your accurate address details for smooth delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Card Form Container */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-100">
            <form onSubmit={onSubmitHandler} className="space-y-4">
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
                placeholder="Email Address"
              />

              <InputField
                handleChange={handleChange}
                address={address}
                name="street"
                type="text"
                placeholder="Street Address"
              />

              <InputField
                handleChange={handleChange}
                address={address}
                name="landmark"
                type="text"
                placeholder="Landmark (Optional)"
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
                  placeholder="Zip Code"
                  maxLength={10}
                />
                <div className="w-full">
                  <CountrySelect address={address} handleChange={handleChange} />
                  {errors.country && (
                    <p className="text-rose-500 text-xs mt-1 ml-1 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      {errors.country}
                    </p>
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

              {/* Informational Callout */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900 font-semibold">WhatsApp Notifications:</strong> Updates regarding shipment status will be sent to this mobile number.
                </p>
              </div>

              {/* Submit Button */}
              <button className="w-full mt-4 bg-slate-900 hover:bg-indigo-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-slate-900/10 transition-all duration-200 uppercase tracking-wider text-xs cursor-pointer">
                Save Address
              </button>
            </form>
          </div>

          {/* Right Preview Image */}
          <div className="lg:col-span-5 sticky top-8 item-center">
            <div className="rounded-2xl overflow-hidden  p-2 ">
              <img
                className="rounded-xl w-full h-[400px] "
                src={assets.add_address_iamge}
                alt="Add Address"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAddress;