
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface NewsItem {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  source: string;
}

interface NewsDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newsItem: NewsItem | null;
}

const NewsDetailDialog = ({ open, onOpenChange, newsItem }: NewsDetailDialogProps) => {
  if (!newsItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-orange-800">{newsItem.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-orange-600">{newsItem.category}</Badge>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="relative w-full h-64 overflow-hidden rounded-md">
            <img 
              src={newsItem.imageUrl} 
              alt={newsItem.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback image if the original fails to load
                e.currentTarget.src = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop";
              }}
            />
          </div>
          
          <div className="space-y-3">
            <p className="text-gray-700 leading-relaxed text-lg">
              {newsItem.description}
            </p>
            
            <p className="text-gray-900 leading-relaxed">
              This exclusive update showcases the latest developments in the Indian classical arts scene. 
              Enthusiasts and practitioners alike are excited about this new development, which represents a 
              significant milestone for the {newsItem.category.toLowerCase()} community.
            </p>
            
            <div className="italic text-sm text-gray-500">
              Source: {newsItem.source}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewsDetailDialog;
