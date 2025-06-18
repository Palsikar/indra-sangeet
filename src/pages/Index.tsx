import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { toast } from 'sonner';
import { Pencil, Calendar, Music, Users, X, Radio, Headphones, Volume2 } from 'lucide-react';
import EditInterestsDialog from '@/components/EditInterestsDialog';
import NewsDetailDialog from '@/components/NewsDetailDialog';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyDF5iTPenQShZq0lFf1_79pCXNjDOT5LA0");

interface NewsItem {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
}

interface UserPreferences {
  interests: string[];
  preferredCategories: string[];
}

// Your uploaded music and dance images
const musicDanceImages = [
  "/lovable-uploads/4dd0281a-53f4-490a-bcf8-33c26dd339f1.png", // Musical notes with dancers silhouette
  "/lovable-uploads/2d9d9ca2-8713-4b5a-97f4-b135fbc6b16c.png", // Children singing and dancing
  "/lovable-uploads/b3c07727-72aa-4c1c-879e-28c09d1e0d63.png", // Colorful dancers with musical notes
  "/lovable-uploads/5b1945df-210e-4104-88f1-e415887365f4.png", // Music and dance icons
  "/lovable-uploads/2f32aed4-6d95-4582-b88f-850cd9e5eea6.png", // Dancers with equalizer background
  "/lovable-uploads/094e116c-92a5-4c2c-a754-36a7ce7ce73c.png", // Joyful dancers with musical staff
];

// Function to get unique images for news items
const getUniqueImageForNews = (usedImages: Set<string>) => {
  const availableImages = musicDanceImages.filter(img => !usedImages.has(img));
  
  if (availableImages.length === 0) {
    // If all images are used, reset and start over
    usedImages.clear();
    return musicDanceImages[0];
  }
  
  const selectedImage = availableImages[Math.floor(Math.random() * availableImages.length)];
  usedImages.add(selectedImage);
  return selectedImage;
};

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    interests: [],
    preferredCategories: []
  });
  const [loadingNews, setLoadingNews] = useState(false);
  const [isEditInterestsOpen, setIsEditInterestsOpen] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [isNewsDetailOpen, setIsNewsDetailOpen] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        toast.success('Welcome to Indra Sangeet Pulse!');
        // Defer data loading to prevent deadlocks
        setTimeout(() => {
          loadUserPreferences(session.user.id);
        }, 100);
      } else {
        // Clear preferences when user logs out
        setUserPreferences({ interests: [], preferredCategories: [] });
        setNewsItems([]);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          loadUserPreferences(session.user.id);
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user preferences and fetch news when preferences change
  useEffect(() => {
    if (user && userPreferences.interests.length > 0) {
      fetchLatestUpdates();
    }
  }, [userPreferences, user]);

  const loadUserPreferences = async (userId: string) => {
    try {
      console.log('Loading preferences for user:', userId);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading preferences:', error);
        toast.error('Failed to load your preferences');
        return;
      }

      if (data) {
        console.log('Loaded preferences:', data);
        const loadedPreferences = {
          interests: data.interests || [],
          preferredCategories: data.preferred_categories || []
        };
        setUserPreferences(loadedPreferences);
        toast.success('Your preferences have been loaded!');
      } else {
        // Create default preferences for new user
        console.log('Creating default preferences for new user');
        const defaultPreferences = {
          interests: ['classical dance', 'bollywood music'],
          preferredCategories: ['Bharatanatyam', 'Kathak', 'Hindustani Classical', 'Carnatic Music']
        };
        
        await saveUserPreferences(userId, defaultPreferences);
        setUserPreferences(defaultPreferences);
        toast.success('Default preferences created for you!');
      }
    } catch (error) {
      console.error('Error in loadUserPreferences:', error);
      toast.error('Failed to load preferences');
    }
  };

  const saveUserPreferences = async (userId: string, preferences: UserPreferences) => {
    try {
      console.log('Saving preferences for user:', userId, preferences);
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          interests: preferences.interests,
          preferred_categories: preferences.preferredCategories,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving preferences:', error);
        toast.error('Failed to save preferences');
        return false;
      } else {
        console.log('Preferences saved successfully');
        toast.success('Preferences saved successfully!');
        return true;
      }
    } catch (error) {
      console.error('Error in saveUserPreferences:', error);
      toast.error('Failed to save preferences');
      return false;
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined // Disable email verification
          }
        });
        if (error) throw error;
        
        toast.success('Account created and logged in successfully!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Logged in successfully!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully!');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message);
    }
  };

  const fetchLatestUpdates = async () => {
    setLoadingNews(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const currentDate = new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const prompt = `Search Google and find 6 real, latest, and most current news articles about Indian dance and music happening RIGHT NOW in ${currentDate}. Use actual web search capabilities to find breaking news, recent events, and current developments. Each update should include:
      - title: A compelling headline about CURRENT events from real news sources
      - description: 2-3 sentences with specific recent details, dates, and current happenings from actual news articles
      - category: One of (Classical Dance, Folk Dance, Bollywood, Classical Music, Folk Music, Contemporary)
      
      Focus on user interests: ${userPreferences.interests.join(', ')}, ${userPreferences.preferredCategories.join(', ')}.
      
      Search for CURRENT trends like: recent performances this week, ongoing festivals, new song releases, viral dance videos, artist announcements, concert bookings, award ceremonies, digital platform launches, social media trends, government cultural initiatives, international collaborations, emerging artist debuts, breaking entertainment news, recent album launches, dance competitions, music festivals, cultural events.
      
      Make sure each news item is from a real, verifiable source and happened TODAY, THIS WEEK, or THIS MONTH. Include specific recent details and current relevance from actual news articles found through web search.
      
      Return only valid JSON array format without any markdown formatting:
      [
        {
          "title": "Real news headline from actual source",
          "description": "Real description from actual news article with specific details",
          "category": "One of the specified categories"
        }
      ]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedNews = JSON.parse(jsonMatch[0]);
        const usedImages = new Set<string>();
        
        // Add unique images to each news item
        const newsWithImages = parsedNews.map((item: NewsItem) => ({
          ...item,
          imageUrl: getUniqueImageForNews(usedImages)
        }));
        setNewsItems(newsWithImages);
      } else {
        // Enhanced fallback with unique images
        const usedImages = new Set<string>();
        const fallbackNews = [
          {
            title: "Today: Sitar Virtuoso Announces Digital Concert Series",
            description: "Renowned sitarist launches an innovative online concert series featuring classical ragas. The weekly performances will stream live every Friday, showcasing traditional Hindustani music with modern presentation techniques.",
            category: "Classical Music"
          },
          {
            title: "This Week: Tabla Maestro's New Album Breaks Streaming Records",
            description: "A fusion album combining traditional tabla rhythms with contemporary beats has garnered over 2 million streams in just three days. The innovative approach is attracting younger audiences to classical Indian percussion.",
            category: "Classical Music"
          },
          {
            title: "Latest: Bharatanatyam Performance Goes Viral on Social Media",
            description: "A Chennai-based dancer's contemporary interpretation of classical Bharatanatyam has received 5 million views across platforms. The performance beautifully blends traditional mudras with modern storytelling techniques.",
            category: "Classical Dance"
          },
          {
            title: "Breaking: Bollywood Music Director Collaborates with Folk Artists",
            description: "Today's announcement reveals an upcoming album featuring Rajasthani folk musicians collaborating with mainstream Bollywood composers. The project aims to preserve traditional melodies while creating contemporary appeal.",
            category: "Bollywood"
          },
          {
            title: "Recent: Veena Revival Movement Gains International Recognition",
            description: "Young musicians worldwide are embracing the ancient veena, with online tutorials surging 300% this month. International music schools are now incorporating this classical Indian instrument into their curriculum.",
            category: "Classical Music"
          },
          {
            title: "Today: Contemporary Dance Festival Showcases Indian Fusion",
            description: "The ongoing international dance festival in Mumbai is featuring innovative contemporary pieces that blend classical Indian forms with global dance styles. Tickets for remaining shows are selling out rapidly.",
            category: "Contemporary"
          }
        ].map(item => ({
          ...item,
          imageUrl: getUniqueImageForNews(usedImages)
        }));
        setNewsItems(fallbackNews);
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast.error('Failed to fetch latest updates');
    } finally {
      setLoadingNews(false);
    }
  };

  const updatePreferences = async (newInterest: string) => {
    if (!user) {
      toast.error('Please log in to add interests');
      return;
    }
    
    if (userPreferences.interests.includes(newInterest)) {
      toast.error('This interest is already in your list');
      return;
    }

    const newPreferences = {
      ...userPreferences,
      interests: [...userPreferences.interests, newInterest]
    };
    
    const saved = await saveUserPreferences(user.id, newPreferences);
    if (saved) {
      setUserPreferences(newPreferences);
    }
  };

  const saveUpdatedPreferences = async (newPreferences: UserPreferences) => {
    if (!user) return;
    
    const saved = await saveUserPreferences(user.id, newPreferences);
    if (saved) {
      setUserPreferences(newPreferences);
    }
  };

  const openNewsDetail = (item: NewsItem) => {
    setSelectedNewsItem(item);
    setIsNewsDetailOpen(true);
  };

  const removeInterest = async (interestToRemove: string) => {
    if (!user) {
      toast.error('Please log in to remove interests');
      return;
    }

    const newPreferences = {
      ...userPreferences,
      interests: userPreferences.interests.filter(interest => interest !== interestToRemove)
    };
    
    const saved = await saveUserPreferences(user.id, newPreferences);
    if (saved) {
      setUserPreferences(newPreferences);
      toast.success(`Removed "${interestToRemove}" from your interests`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Musical Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 text-6xl">🎵</div>
          <div className="absolute top-40 right-32 text-4xl">🎶</div>
          <div className="absolute bottom-32 left-16 text-5xl">🎼</div>
          <div className="absolute bottom-20 right-20 text-6xl">🎹</div>
          <div className="absolute top-60 left-1/2 text-3xl">🥁</div>
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Music className="h-8 w-8 text-purple-300" />
              <h1 className="text-4xl font-bold text-white">Indra Sangeet Pulse</h1>
              <Radio className="h-8 w-8 text-purple-300" />
            </div>
            <p className="text-purple-200">Your gateway to Indian dance & music updates</p>
          </div>
          
          <Card className="shadow-2xl border-purple-300 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-purple-800 flex items-center justify-center gap-2">
                <Headphones className="h-6 w-6" />
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-purple-200 focus:border-purple-400"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-purple-200 focus:border-purple-400"
              />
              <Button 
                onClick={handleAuth} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-purple-600 hover:text-purple-700"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header with Musical Theme */}
      <header className="bg-gradient-to-r from-purple-800 via-blue-800 to-indigo-800 shadow-2xl border-b-4 border-purple-500">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Music className="h-8 w-8 text-purple-200" />
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                Indra Sangeet Pulse
                <Volume2 className="h-6 w-6 text-purple-200" />
              </h1>
              <p className="text-purple-200">Welcome, {user.email}</p>
            </div>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="border-purple-300 text-purple-200 hover:bg-purple-700 hover:text-white"
          >
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="updates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-purple-100 to-blue-100">
            <TabsTrigger value="updates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Radio className="h-4 w-4 mr-2" />
              Latest Updates
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <Headphones className="h-4 w-4 mr-2" />
              My Interests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="updates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
                <Music className="h-6 w-6" />
                Latest in Dance & Music
              </h2>
              <Button 
                onClick={fetchLatestUpdates}
                disabled={loadingNews}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loadingNews ? 'Refreshing...' : 'Refresh Updates'}
              </Button>
            </div>

            {loadingNews ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse border-purple-200">
                    <div className="h-48 bg-gradient-to-r from-purple-200 to-blue-200 rounded-t-lg"></div>
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-purple-200 rounded w-3/4"></div>
                      <div className="h-3 bg-purple-200 rounded w-full"></div>
                      <div className="h-3 bg-purple-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsItems.map((item, index) => (
                  <HoverCard key={index}>
                    <HoverCardTrigger asChild>
                      <Card 
                        className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-purple-200 cursor-pointer transform hover:scale-105 hover:border-purple-400"
                        onClick={() => openNewsDetail(item)}
                      >
                        <div className="h-48 overflow-hidden relative">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-300">
                              {item.category}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg mb-2 text-purple-900 line-clamp-2">{item.title}</h3>
                          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{item.description}</p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-purple-600 hover:text-purple-800 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                openNewsDetail(item);
                              }}
                            >
                              Read more
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-white border-purple-200 shadow-xl">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Music className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-purple-800">{item.category}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>Indra Sangeet Pulse</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{item.description}</p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="border-purple-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="text-purple-800 flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Your Musical Interests
                </CardTitle>
                <Button 
                  onClick={() => setIsEditInterestsOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100 flex items-center gap-1"
                >
                  <Pencil className="h-4 w-4" /> Edit Interests
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h4 className="font-semibold mb-3 text-purple-700 flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Current Interests:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.interests.map((interest, index) => (
                      <Badge key={index} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center gap-1 pr-1 hover:from-purple-700 hover:to-blue-700 transition-all">
                        {interest}
                        <button 
                          onClick={() => removeInterest(interest)}
                          className="ml-1 hover:bg-purple-700 rounded-full p-0.5 transition-colors"
                          title={`Remove ${interest}`}
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                    {userPreferences.interests.length === 0 && (
                      <span className="text-gray-500 italic">No interests added yet</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-purple-700 flex items-center gap-2">
                    <Radio className="h-4 w-4" />
                    Preferred Categories:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.preferredCategories.map((category, index) => (
                      <Badge key={index} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-purple-700 flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Quick Add Interests:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Odissi', 'Kuchipudi', 'Manipuri', 'Mohiniyattam', 'Punjabi Folk', 'Qawwali',
                      'Tabla', 'Sitar', 'Veena', 'Flute', 'Harmonium', 'Sarod', 'Mridangam', 'Violin',
                      'Thumri', 'Ghazal', 'Bhajan', 'Kirtan', 'Sufi Music', 'Folk Songs', 'Dhrupad',
                      'Bharatanatyam Fusion', 'Contemporary Indian', 'Semi-Classical', 'Devotional Music',
                      'Regional Folk Dances', 'Lavani', 'Garba', 'Bhangra', 'Giddha', 'Rouf', 'Bihu',
                      'Kalaripayattu', 'Chhau', 'Sattriya', 'Yakshagana', 'Theyyam', 'Pulikali',
                      'Hindustani Vocal', 'Carnatic Vocal', 'Light Classical', 'Fusion Music',
                      'Bollywood Dance', 'Item Numbers', 'Wedding Choreography', 'Stage Performances'
                    ].map((interest) => (
                      <Button
                        key={interest}
                        variant="outline"
                        size="sm"
                        onClick={() => updatePreferences(interest)}
                        className="border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400"
                        disabled={userPreferences.interests.includes(interest)}
                      >
                        + {interest}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <EditInterestsDialog 
        open={isEditInterestsOpen} 
        onOpenChange={setIsEditInterestsOpen}
        userPreferences={userPreferences}
        onSave={saveUpdatedPreferences}
      />
      
      <NewsDetailDialog 
        open={isNewsDetailOpen}
        onOpenChange={setIsNewsDetailOpen}
        newsItem={selectedNewsItem}
      />
    </div>
  );
};

export default Index;
