import { useState } from "react";
import { toast } from "react-toastify";
import { User, Mail, Phone, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Card, Input, Button } from "../components/ui";
import { validateForm } from "../utils/validateForm";

const profileRules = {
  name: [{ rule: "required", message: "Name is required" }],
  email: [
    { rule: "required", message: "Email is required" },
    { rule: "email", message: "Enter a valid email" },
  ],
  phone: [{ rule: "required", message: "Phone is required" }],
};

const passwordRules = {
  newPassword: [
    { rule: "required", message: "New password is required" },
    { rule: "minLength", min: 6, message: "Min 6 characters" },
  ],
  currentPassword: [{ rule: "required", message: "Current password is required" }],
};

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [pErrors, setPErrors] = useState({});
  const [pwdErrors, setPwdErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
    if (pErrors[name]) setPErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handlePwdChange = (e) => {
    const { name, value } = e.target;
    setPwd((p) => ({ ...p, [name]: value }));
    if (pwdErrors[name]) setPwdErrors((er) => ({ ...er, [name]: undefined }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const { errors, isValid } = validateForm(profile, profileRules);
    setPErrors(errors);
    if (!isValid) return;

    setSavingProfile(true);
    try {
      await updateProfile(profile);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const { errors, isValid } = validateForm(pwd, passwordRules);
    setPwdErrors(errors);
    if (!isValid) return;

    setSavingPwd(true);
    try {
      await updateProfile(pwd);
      setPwd({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPwd(false);
    }
  };

  const initials = (user?.name || "SA")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">My Profile</h2>
        <p className="text-sm text-slate-500">Manage your account details and password</p>
      </div>

      {/* Profile header */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
            {initials}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-slate-800">{user?.name}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              Super Admin
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic details */}
        <Card title="Basic Details" className="p-0">
          <form onSubmit={saveProfile} className="space-y-4 p-5">
            <Input label="Full Name" name="name" icon={User} value={profile.name} onChange={handleProfileChange} error={pErrors.name} />
            <Input label="Email" name="email" type="email" icon={Mail} value={profile.email} onChange={handleProfileChange} error={pErrors.email} />
            <Input label="Phone" name="phone" icon={Phone} value={profile.phone} onChange={handleProfileChange} error={pErrors.phone} />
            <div className="pt-2">
              <Button type="submit" loading={savingProfile}>Save Changes</Button>
            </div>
          </form>
        </Card>

        {/* Change password */}
        <Card title="Change Password" className="p-0">
          <form onSubmit={changePassword} className="space-y-4 p-5">
            <Input label="Current Password" name="currentPassword" type="password" icon={Lock} value={pwd.currentPassword} onChange={handlePwdChange} error={pwdErrors.currentPassword} />
            <Input label="New Password" name="newPassword" type="password" icon={Lock} value={pwd.newPassword} onChange={handlePwdChange} error={pwdErrors.newPassword} hint="Must be at least 6 characters" />
            <div className="pt-2">
              <Button type="submit" loading={savingPwd} variant="secondary">Update Password</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
