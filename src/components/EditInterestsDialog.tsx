
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";

interface UserInterest {
  interests: string[];
  preferredCategories: string[];
}

interface EditInterestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPreferences: UserInterest;
  onSave: (preferences: UserInterest) => void;
}

const EditInterestsDialog = ({ 
  open, 
  onOpenChange, 
  userPreferences, 
  onSave 
}: EditInterestsDialogProps) => {
  const [editedPreferences, setEditedPreferences] = useState<UserInterest>({...userPreferences});
  const [newInterest, setNewInterest] = useState("");

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    
    if (!editedPreferences.interests.includes(newInterest.trim())) {
      setEditedPreferences(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest("");
      toast.success(`Added "${newInterest.trim()}" to your interests`);
    } else {
      toast.error("This interest already exists in your list");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setEditedPreferences(prev => ({
      ...prev,
      interests: prev.interests.filter(item => item !== interest)
    }));
    toast.info(`Removed "${interest}" from your interests`);
  };

  const handleSaveChanges = () => {
    onSave(editedPreferences);
    onOpenChange(false);
    toast.success("Your interests have been updated!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-orange-800">Edit Your Interests</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add new interest"
              className="border-orange-200"
            />
            <Button 
              onClick={handleAddInterest}
              className="bg-orange-600 hover:bg-orange-700"
              type="button"
            >
              Add
            </Button>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2 text-orange-700">Your Interests:</h4>
            <div className="flex flex-wrap gap-2">
              {editedPreferences.interests.map((interest, index) => (
                <Badge key={index} className="bg-orange-600 text-white flex items-center gap-1 pr-1">
                  {interest}
                  <button 
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-1 hover:bg-orange-700 rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
              {editedPreferences.interests.length === 0 && (
                <span className="text-gray-500 italic">No interests added yet</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline" 
            className="border-orange-300 text-orange-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveChanges}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditInterestsDialog;
