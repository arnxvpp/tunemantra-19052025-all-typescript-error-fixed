import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  BarChart2,
  Music,
  Package,
  ShoppingCart,
  Upload,
  Users,
  DollarSign,
  Headphones,
  Clock,
  ArrowRight
} from 'lucide-react';
import { TestCredentialsHelper } from '@/components/debug/TestCredentialsHelper';
import { useFeatureAccess } from '@/hooks/use-feature-access';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  percentChange?: number;
  link?: string;
}

// Memoize the StatCard component to prevent unnecessary re-renders
const StatCard = memo(({ title, value, description, icon, percentChange, link }: StatCardProps) => {
  return (
    <Card className="c-card dashboard-card">
      <div className="c-card-body d-flex">
        <div className="c-icon-wrapper text-white mr-3">
          <div className="c-icon bg-primary-gradient">
            {icon}
          </div>
        </div>
        <div>
          <div className="text-value text-primary">{value}</div>
          <div className="text-muted small text-uppercase font-weight-bold">{title}</div>
          {percentChange !== undefined && (
            <div className={`small mt-1 ${percentChange >= 0 ? 'text-success' : 'text-danger'}`}>
              {percentChange >= 0 ? '↑' : '↓'} {Math.abs(percentChange)}%
            </div>
          )}
        </div>
      </div>
      <div className="c-chart-wrapper mt-3 mx-3" style={{ height: '70px' }}></div>
      <div className="card-footer px-3 py-2">
        <Link href={link || '#'}>
          <a className="btn-block text-muted d-flex justify-content-between align-items-center">
            <span>{description}</span>
            <ArrowRight size={16} />
          </a>
        </Link>
      </div>
    </Card>
  );
});

function CoreUIHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tracks: 42,
    releases: 8,
    revenue: 2150,
    streams: 12453,
    pendingUploads: 3,
    teamMembers: 4
  });

  // Stats row
  const statCards = [
    {
      title: "Tracks",
      value: stats.tracks,
      description: "View all tracks",
      icon: <Music size={24} />,
      percentChange: 8.4,
      link: "/catalog/tracks"
    },
    {
      title: "Releases",
      value: stats.releases,
      description: "View all releases",
      icon: <Package size={24} />,
      percentChange: 3.2,
      link: "/catalog/releases"
    },
    {
      title: "Revenue",
      value: `$${stats.revenue.toLocaleString()}`,
      description: "View earnings details",
      icon: <DollarSign size={24} />,
      percentChange: 12.7,
      link: "/payments"
    },
    {
      title: "Streams",
      value: stats.streams.toLocaleString(),
      description: "View analytics",
      icon: <Headphones size={24} />,
      percentChange: 5.3,
      link: "/analytics"
    }
  ];

  // Dynamic activity items
  const activityItems = [
    {
      title: "New release approved",
      description: "Your album 'Midnight Sessions' is now available on all platforms",
      time: "2 hours ago",
      icon: <Music size={20} className="text-success" />
    },
    {
      title: "Pending upload",
      description: "Your single 'Summer Vibes' requires additional information",
      time: "Yesterday",
      icon: <Upload size={20} className="text-warning" />
    },
    {
      title: "Revenue update",
      description: "You've earned $342 from Spotify streams this month",
      time: "2 days ago",
      icon: <DollarSign size={20} className="text-primary" />
    },
    {
      title: "Team member joined",
      description: "Sarah Williams has accepted your team invitation",
      time: "1 week ago",
      icon: <Users size={20} className="text-info" />
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Welcome header */}
      <div className="c-row mb-4">
        <div className="c-col">
          <div className="c-card bg-gradient-light-to-secondary text-white">
            <div className="c-card-body">
              <h2 className="mb-0">Welcome back, {user?.fullName || 'User'}!</h2>
              <p className="text-lighter">Here's what's happening with your music today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards row */}
      <div className="c-row">
        {statCards.map((stat, index) => (
          <div className="c-col-sm-6 c-col-lg-3" key={index}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Two column layout for quick actions and activity */}
      <div className="c-row mt-4">
        {/* Quick actions panel */}
        <div className="c-col-md-4">
          <Card className="c-card dashboard-card mb-4">
            <div className="c-card-header">
              <h4 className="c-card-title mb-0">Quick Actions</h4>
            </div>
            <div className="c-card-body">
              <div className="quick-actions">
                <Link href="/upload">
                  <Button variant="outline" className="w-full mb-3 d-flex align-items-center justify-content-start">
                    <Upload size={18} className="mr-2" /> Upload New Music
                  </Button>
                </Link>
                <Link href="/catalog/distribution-schedule">
                  <Button variant="outline" className="w-full mb-3 d-flex align-items-center justify-content-start">
                    <Clock size={18} className="mr-2" /> Schedule Release
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="outline" className="w-full mb-3 d-flex align-items-center justify-content-start">
                    <BarChart2 size={18} className="mr-2" /> View Analytics
                  </Button>
                </Link>
                <Link href="/payments">
                  <Button variant="outline" className="w-full mb-3 d-flex align-items-center justify-content-start">
                    <ShoppingCart size={18} className="mr-2" /> Manage Payments
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Debug helper in development */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="c-card dashboard-card mb-4">
              <div className="c-card-header">
                <h4 className="c-card-title mb-0">Development Testing</h4>
              </div>
              <div className="c-card-body">
                <TestCredentialsHelper onSelectCredential={(credential) => console.log('Selected credential:', credential)} />
              </div>
            </Card>
          )}
        </div>

        {/* Recent activity feed */}
        <div className="c-col-md-8">
          <Card className="c-card dashboard-card">
            <div className="c-card-header">
              <h4 className="c-card-title mb-0">Recent Activity</h4>
            </div>
            <div className="c-card-body p-0">
              <div className="activity-feed">
                {activityItems.map((item, index) => (
                  <div key={index} className="activity-item p-3 border-bottom d-flex align-items-start">
                    <div className="activity-icon mr-3">{item.icon}</div>
                    <div className="activity-content flex-grow-1">
                      <div className="font-weight-bold">{item.title}</div>
                      <div className="text-smaller text-muted">{item.description}</div>
                    </div>
                    <div className="activity-time small text-muted">{item.time}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="c-card-footer">
              <Button variant="ghost" className="w-full">View All Activity</Button>
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          padding: 1rem 0;
        }
        
        .c-row {
          display: flex;
          flex-wrap: wrap;
          margin-right: -15px;
          margin-left: -15px;
        }
        
        .c-col, .c-col-md-4, .c-col-md-8, .c-col-sm-6, .c-col-lg-3 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
        }
        
        @media (min-width: 576px) {
          .c-col-sm-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }
        }
        
        @media (min-width: 768px) {
          .c-col-md-4 {
            flex: 0 0 33.333333%;
            max-width: 33.333333%;
          }
          .c-col-md-8 {
            flex: 0 0 66.666667%;
            max-width: 66.666667%;
          }
        }
        
        @media (min-width: 992px) {
          .c-col-lg-3 {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }
        
        .c-card {
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
          word-wrap: break-word;
          background-color: #fff;
          background-clip: border-box;
          border: 1px solid #d8dbe0;
          border-radius: 0.25rem;
          margin-bottom: 1.5rem;
        }
        
        .c-card-header {
          padding: 0.75rem 1.25rem;
          margin-bottom: 0;
          background-color: #f8f9fa;
          border-bottom: 1px solid #d8dbe0;
        }
        
        .c-card-title {
          margin-bottom: 0.5rem;
          font-size: 1.09375rem;
          font-weight: 500;
        }
        
        .c-card-body {
          flex: 1 1 auto;
          min-height: 1px;
          padding: 1.25rem;
        }
        
        .c-card-footer {
          padding: 0.75rem 1.25rem;
          background-color: #f8f9fa;
          border-top: 1px solid #d8dbe0;
        }
        
        .bg-gradient-light-to-secondary {
          background: linear-gradient(45deg, #3c4b64 0%, #768192 100%);
        }
        
        .text-lighter {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .c-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .c-icon {
          width: 4rem;
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
        }
        
        .bg-primary-gradient {
          background: linear-gradient(135deg, #321fdb 0%, #1f8feb 100%);
        }
        
        .text-value {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.2;
        }
        
        .activity-feed {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .activity-item {
          transition: background-color 0.3s;
        }
        
        .activity-item:hover {
          background-color: #f8f9fa;
        }
        
        .activity-icon {
          min-width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .border-bottom {
          border-bottom: 1px solid #d8dbe0;
        }
        
        .d-flex {
          display: flex;
        }
        
        .align-items-center {
          align-items: center;
        }
        
        .align-items-start {
          align-items: flex-start;
        }
        
        .justify-content-start {
          justify-content: flex-start;
        }
        
        .justify-content-between {
          justify-content: space-between;
        }
        
        .flex-grow-1 {
          flex-grow: 1;
        }
        
        .mr-2 {
          margin-right: 0.5rem;
        }
        
        .mr-3 {
          margin-right: 1rem;
        }
        
        .mb-0 {
          margin-bottom: 0;
        }
        
        .mb-3 {
          margin-bottom: 1rem;
        }
        
        .mb-4 {
          margin-bottom: 1.5rem;
        }
        
        .mt-1 {
          margin-top: 0.25rem;
        }
        
        .mt-3 {
          margin-top: 1rem;
        }
        
        .mt-4 {
          margin-top: 1.5rem;
        }
        
        .mx-3 {
          margin-left: 1rem;
          margin-right: 1rem;
        }
        
        .p-0 {
          padding: 0;
        }
        
        .p-3 {
          padding: 1rem;
        }
        
        .px-3 {
          padding-left: 1rem;
          padding-right: 1rem;
        }
        
        .py-2 {
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
        
        .w-full {
          width: 100%;
        }
        
        .text-primary {
          color: #321fdb;
        }
        
        .text-success {
          color: #2eb85c;
        }
        
        .text-warning {
          color: #f9b115;
        }
        
        .text-info {
          color: #39f;
        }
        
        .text-danger {
          color: #e55353;
        }
        
        .text-muted {
          color: #768192;
        }
        
        .text-white {
          color: #fff;
        }
        
        .text-uppercase {
          text-transform: uppercase;
        }
        
        .small {
          font-size: 85%;
        }
        
        .text-smaller {
          font-size: 90%;
        }
        
        .font-weight-bold {
          font-weight: 700;
        }
        
        .btn-block {
          display: block;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

export default CoreUIHomePage;