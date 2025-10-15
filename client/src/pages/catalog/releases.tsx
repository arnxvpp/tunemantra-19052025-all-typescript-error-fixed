import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Release } from "@shared/schema";
import { Plus, Loader2, Music, Video, SortAsc, SortDesc, Filter, Album, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogLayout } from "./layout";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { CoreUIPageWrapper } from "@/components/layout/core-ui-page-wrapper";

type SortField = "title" | "artistName" | "createdAt" | "status";
type SortOrder = "asc" | "desc";

export default function ReleasesPage() {
  return (
    <CatalogLayout>
      <AudioReleasesPage />
    </CatalogLayout>
  );
}

function AudioReleasesPage() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ["/api/releases", "audio"],
    queryFn: async () => {
      const res = await apiRequest("/api/releases?type=audio", "GET");
      return res;
    },
  });

  const filteredAndSortedReleases = [...releases]
    .filter(release => statusFilter === "all" ? true : release.status === statusFilter)
    .sort((a, b) => {
      if (sortField === "createdAt") {
        // Safely parse dates
        const dateA = a.createdAt ? new Date(a.createdAt.toString()) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt.toString()) : new Date(0);
        
        return sortOrder === "desc"
          ? dateB.getTime() - dateA.getTime()
          : dateA.getTime() - dateB.getTime();
      }
      return sortOrder === "desc"
        ? b[sortField]?.localeCompare(a[sortField])
        : a[sortField]?.localeCompare(b[sortField]);
    });

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: "calc(100vh - 180px)" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Header actions for the page wrapper
  const headerActions = (
    <Button onClick={() => setLocation("/upload")}>
      <Plus className="h-4 w-4 mr-2" />
      New Audio Release
    </Button>
  );

  return (
    <CoreUIPageWrapper 
      title="Audio Releases" 
      subtitle="Manage your music catalog"
      icon={<Album size={24} />}
      actions={headerActions}
    >
      <Card className="c-card mb-4">
        <div className="c-card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="mr-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="d-flex align-items-center">
                  {sortOrder === "desc" ? <SortDesc className="h-4 w-4 mr-2" /> : <SortAsc className="h-4 w-4 mr-2" />}
                  Sort by {sortField}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  setSortField("title");
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                }}>
                  Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSortField("artistName");
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                }}>
                  Artist Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSortField("createdAt");
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                }}>
                  Created Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSortField("status");
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                }}>
                  Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="c-row">
            {filteredAndSortedReleases.map((release: any) => (
              <div className="c-col-sm-6 c-col-lg-4 mb-4" key={release.id}>
                <Card className="c-card h-100 release-card">
                  <CardContent className="c-card-body p-0">
                    <div className="c-card-header d-flex align-items-center justify-content-between">
                      <Badge
                        variant={
                          release.status === "published" ? "default" :
                            release.status === "pending" ? "secondary" :
                              release.status === "rejected" ? "destructive" :
                                "outline"
                        }
                      >
                        {release.status}
                      </Badge>
                      <Badge variant="secondary" className="d-flex align-items-center">
                        <Music className="w-3 h-3 mr-1" />
                        Audio
                      </Badge>
                    </div>

                    <div className="release-content p-3">
                      <h3 className="release-title">{release.title}</h3>
                      <p className="release-artist">{release.artistName}</p>
                      
                      <div className="release-details">
                        <div className="detail-item">
                          <span className="detail-label">Label:</span>
                          <span className="detail-value">{release.labelName}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Genre:</span>
                          <span className="detail-value">{release.genre}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">UPC:</span>
                          <span className="detail-value font-mono">{release.upc}</span>
                        </div>
                      </div>
                    </div>

                    <div className="c-card-footer d-flex align-items-center justify-content-between">
                      <small className="text-muted">
                        {release.createdAt ? format(new Date(release.createdAt.toString()), "MMM d, yyyy") : 'No date'}
                      </small>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/catalog/releases/${release.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            {filteredAndSortedReleases.length === 0 && (
              <div className="c-col-12 text-center py-5">
                <div className="empty-state">
                  <Package size={48} className="text-muted mb-3" />
                  <h3 className="text-lg font-medium">No releases found</h3>
                  <p className="text-muted mt-1">
                    {statusFilter === "all"
                      ? "Create your first release to get started"
                      : `No releases with status "${statusFilter}" found`}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => setLocation("/upload")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Release
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <style>{`
        .release-card {
          transition: transform 0.2s, box-shadow 0.2s;
          height: 100%;
        }
        
        .release-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 21, 0.15);
          border-color: var(--primary);
        }
        
        .c-card-header {
          padding: 1rem;
          background-color: #f8f9fa;
          border-bottom: 1px solid #d8dbe0;
        }
        
        .release-content {
          padding: 1rem;
        }
        
        .release-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.3rem;
        }
        
        .release-artist {
          font-size: 0.9rem;
          color: #768192;
          margin-bottom: 1rem;
        }
        
        .release-details {
          margin-top: 1rem;
        }
        
        .detail-item {
          display: flex;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }
        
        .detail-label {
          flex: 0 0 auto;
          color: #768192;
          width: 50px;
        }
        
        .detail-value {
          flex: 1;
        }
        
        .c-card-footer {
          padding: 0.75rem 1rem;
          background-color: #f8f9fa;
          border-top: 1px solid #d8dbe0;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        
        .c-row {
          display: flex;
          flex-wrap: wrap;
          margin-right: -15px;
          margin-left: -15px;
        }
        
        .c-col-12, .c-col-sm-6, .c-col-lg-4 {
          position: relative;
          width: 100%;
          padding-right: 15px;
          padding-left: 15px;
        }
        
        .c-col-12 {
          flex: 0 0 100%;
          max-width: 100%;
        }
        
        @media (min-width: 576px) {
          .c-col-sm-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }
        }
        
        @media (min-width: 992px) {
          .c-col-lg-4 {
            flex: 0 0 33.333333%;
            max-width: 33.333333%;
          }
        }
        
        .mb-4 {
          margin-bottom: 1.5rem;
        }
        
        .mr-2 {
          margin-right: 0.5rem;
        }
        
        .mr-3 {
          margin-right: 1rem;
        }
        
        .mt-1 {
          margin-top: 0.25rem;
        }
        
        .mt-3 {
          margin-top: 1rem;
        }
        
        .mb-3 {
          margin-bottom: 1rem;
        }
        
        .py-5 {
          padding-top: 3rem;
          padding-bottom: 3rem;
        }
        
        .p-3 {
          padding: 1rem;
        }
        
        .h-100 {
          height: 100%;
        }
        
        .d-flex {
          display: flex;
        }
        
        .align-items-center {
          align-items: center;
        }
        
        .justify-content-between {
          justify-content: space-between;
        }
        
        .text-muted {
          color: #768192;
        }
        
        .font-mono {
          font-family: monospace;
        }
        
        .spinner-border {
          display: inline-block;
          width: 2rem;
          height: 2rem;
          vertical-align: text-bottom;
          border: 0.25em solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border .75s linear infinite;
        }
        
        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </CoreUIPageWrapper>
  );
}