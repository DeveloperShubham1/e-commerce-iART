import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { login, selectAuthError } from "../Components/Redux/AuthSlice";
import { Input, Button } from "../components/ui";
import { validateForm } from "../utils/validateForm";

const rules = {
  email: [
    { rule: "required", message: "Email is required" },
    { rule: "email", message: "Enter a valid email address" },
  ],
  password: [
    { rule: "required", message: "Password is required" },
    { rule: "minLength", min: 6, message: "Password must be at least 6 characters" },
  ],
};

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authError = useSelector(selectAuthError);
  const submitting = useSelector((state) => state.auth.loginLoading);
  const from = location.state?.from?.pathname || "/dashboard";

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { errors: errs, isValid } = validateForm(values, rules);
    setErrors(errs);

    if (!isValid) return;

    try {
      await dispatch(login(values)).unwrap();
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ form: err });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-primary-50 to-accent-50 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Super Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your ecommerce platform</p>
        </div>

        <div className="card p-6 sm:p-8 animate-slide-up">
          {(errors.form || authError) && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {errors.form || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="admin@example.com"
              icon={Mail}
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              icon={Lock}
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                Remember me
              </label>
              <button type="button" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={submitting} className="w-full" size="lg">
              {!submitting && <ArrowRight className="h-4 w-4" />}
              Sign In
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} SuperAdmin. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
