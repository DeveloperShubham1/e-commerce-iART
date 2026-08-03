import React from 'react'
import MainBanner from '../components/MainBanner'
import Categories from '../components/Categories'
import BestSeller from '../components/BestSeller'
import BottomBanner from '../components/BottomBanner'
import Collections from '../components/Collections'
import NewsLetter from '../components/NewsLetter'
import { useDashboardData } from '../services/user';

const Home = () => {
  const { data: homeData, isLoading: isLoadingHomeData } = useDashboardData();


  return (
    <div>
      <MainBanner />
      <BestSeller data={homeData?.new_products || []} loading={isLoadingHomeData} title="New Arrivals" desc="Discover our latest collection of new arrivals" />
      <Collections data={homeData?.collections || []} loading={isLoadingHomeData} />
      <Categories data={homeData?.categories || []} loading={isLoadingHomeData} />
      <BestSeller data={homeData?.best_seller || []} loading={isLoadingHomeData} title="Best Sellers" desc="Discover our latest collection of best sellers" />
      <BottomBanner />
      {/* <NewsLetter /> */}
    </div>
  )
}

export default Home
