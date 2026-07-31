import { configureStore } from "@reduxjs/toolkit";
import auth from "./Components/Redux/AuthSlice";
import merchant from "./Components/Redux/MerchantSlice";

const Store = configureStore({
  reducer: {
    auth,
    merchant
  },
});

export default Store;
