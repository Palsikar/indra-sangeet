
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Music, Volume2 } from "lucide-react";

interface NewsItem {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
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
      <DialogContent className="max-w-3xl border-purple-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-800 flex items-center gap-2">
            <Music className="h-6 w-6" />
            {newsItem.title}
          </DialogTitle>
          <DialogDescription className="sr-only">Details about {newsItem.title}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              {newsItem.category}
            </Badge>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="relative w-full h-64 overflow-hidden rounded-md shadow-lg">
            <img 
              src={newsItem.imageUrl} 
              alt={newsItem.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const fallbackImages = [
                  "https://images.unsplash.com/photo-1514119412350-e174d90d280e?w=800&h=400&fit=crop",
                  "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&h=400&fit=crop",
                  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop"
                ];
                e.currentTarget.src = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          
          <div className="space-y-3">
            <p className="text-gray-700 leading-relaxed text-lg">
              {newsItem.description}
            </p>
            
            <p className="text-gray-900 leading-relaxed">
              This exclusive update showcases the latest developments in the Indian classical arts scene. 
              Enthusiasts and practitioners alike are excited about this new development, which represents a 
              significant milestone for the {newsItem.category.toLowerCase()} community. The growing digital 
              presence and innovative approaches are helping preserve traditional art forms while making them 
              accessible to global audiences.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-100"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewsDetailDialog;
