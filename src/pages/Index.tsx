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
import { Pencil, Calendar, Music, Users, X } from 'lucide-react';
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

// Enhanced music and dance specific images with better keywords
const getMusicDanceImage = (title: string, category: string) => {
  const musicDanceImages = {
    'Classical Dance': [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80", // Bharatanatyam dancer
      "https://images.unsplash.com/photo-1583224964623-033ed52c6b3b?w=400&h=250&fit=crop&q=80", // Kathak performance
      "https://images.unsplash.com/photo-1516280906200-bf71fe1b1e28?w=400&h=250&fit=crop&q=80", // Classical dance pose
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=250&fit=crop&q=80", // Traditional dance
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=250&fit=crop&q=80", // Indian classical dance
    ],
    'Folk Dance': [
      "https://images.unsplash.com/photo-1516280906200-bf71fe1b1e28?w=400&h=250&fit=crop&q=80", // Folk dance
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop&q=80", // Traditional dance group
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=250&fit=crop&q=80", // Cultural dance
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&q=80", // Folk performance
    ],
    'Bollywood': [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&q=80", // Music and dance
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=250&fit=crop&q=80", // Music production
      "https://images.unsplash.com/photo-1516280906200-bf71fe1b1e28?w=400&h=250&fit=crop&q=80", // Dance performance
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80", // Bollywood music
    ],
    'Classical Music': [
      "https://images.unsplash.com/photo-1514119412350-e174d90d280e?w=400&h=250&fit=crop&q=80", // Sitar player
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=250&fit=crop&q=80", // Tabla drums
      "https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?w=400&h=250&fit=crop&q=80", // Violin classical
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=250&fit=crop&q=80", // Traditional instruments
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&q=80", // Indian classical music
    ],
    'Folk Music': [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=250&fit=crop&q=80", // Folk instruments
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&q=80", // Music performance
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=250&fit=crop&q=80", // Traditional music
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80", // Folk music instruments
    ],
    'Contemporary': [
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=250&fit=crop&q=80", // Contemporary dance
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop&q=80", // Modern dance
      "https://images.unsplash.com/photo-1516280906200-bf71fe1b1e28?w=400&h=250&fit=crop&q=80", // Contemporary performance
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=250&fit=crop&q=80", // Modern fusion
    ]
  };

  const images = musicDanceImages[category as keyof typeof musicDanceImages] || musicDanceImages['Classical Music'];
  return images[Math.floor(Math.random() * images.length)];
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
      
      const prompt = `Generate 6 latest and trending news updates about Indian dance and music in JSON format. Focus on real-time trends and current events. Each update should include:
      - title: A compelling and current headline
      - description: 2-3 sentences describing the update with specific details
      - category: One of (Classical Dance, Folk Dance, Bollywood, Classical Music, Folk Music, Contemporary)
      
      Focus on topics related to user interests: ${userPreferences.interests.join(', ')}, ${userPreferences.preferredCategories.join(', ')}.
      
      Include current trends like: recent performances, festivals, awards, new releases, cultural events, artist collaborations, digital platforms, social media trends, government initiatives, cultural preservation efforts, international recognition, and emerging artists.
      
      Make the news diverse, authentic, and reflect the vibrant Indian arts scene. Return only valid JSON array format without any markdown formatting.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedNews = JSON.parse(jsonMatch[0]);
        // Add relevant images to each news item
        const newsWithImages = parsedNews.map((item: NewsItem) => ({
          ...item,
          imageUrl: getMusicDanceImage(item.title, item.category)
        }));
        setNewsItems(newsWithImages);
      } else {
        // Enhanced fallback news items with better diversity
        const fallbackNews = [
          {
            title: "Bharatanatyam Festival Celebrates Digital Renaissance",
            description: "The annual Bharatanatyam festival in Chennai showcases how traditional dance is embracing digital platforms. Artists are using social media and virtual reality to reach global audiences while preserving ancient traditions.",
            category: "Classical Dance"
          },
          {
            title: "AR Rahman Collaborates with Folk Artists for New Album",
            description: "Oscar-winning composer AR Rahman announces a groundbreaking collaboration with folk musicians from Rajasthan and Bengal. The album promises to blend traditional folk melodies with contemporary production techniques.",
            category: "Folk Music"
          },
          {
            title: "Young Kuchipudi Dancer Wins International Recognition",
            description: "17-year-old Priya Sharma from Hyderabad wins the prestigious International Dance Competition in Paris. Her innovative interpretation of classical Kuchipudi has garnered attention from dance enthusiasts worldwide.",
            category: "Classical Dance"
          },
          {
            title: "Bollywood Music Streaming Reaches New Heights",
            description: "Latest Bollywood soundtracks are breaking streaming records globally, with Indian music gaining unprecedented popularity on international platforms. The fusion of traditional and modern sounds is attracting diverse audiences.",
            category: "Bollywood"
          },
          {
            title: "Carnatic Music Goes Viral on Social Media",
            description: "Young Carnatic musicians are using Instagram and TikTok to share their performances, making classical music accessible to younger generations. The trend is revitalizing interest in traditional South Indian music.",
            category: "Classical Music"
          },
          {
            title: "Contemporary Dance Fusion Gains Momentum",
            description: "Indian choreographers are creating innovative fusion forms that blend classical dance with contemporary movements. These performances are being featured in international dance festivals and gaining critical acclaim.",
            category: "Contemporary"
          }
        ].map(item => ({
          ...item,
          imageUrl: getMusicDanceImage(item.title, item.category)
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-800 mb-2">🎭 Indra Sangeet Pulse</h1>
            <p className="text-orange-600">Your gateway to Indian dance & music updates</p>
          </div>
          
          <Card className="shadow-xl border-orange-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-orange-800">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-orange-200 focus:border-orange-400"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-orange-200 focus:border-orange-400"
              />
              <Button 
                onClick={handleAuth} 
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-orange-600 hover:text-orange-700"
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-orange-800">🎭 Indra Sangeet Pulse</h1>
            <p className="text-orange-600">Welcome, {user.email}</p>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="updates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-orange-100">
            <TabsTrigger value="updates" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Latest Updates
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              My Interests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="updates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-orange-800">Latest in Dance & Music</h2>
              <Button 
                onClick={fetchLatestUpdates}
                disabled={loadingNews}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loadingNews ? 'Refreshing...' : 'Refresh Updates'}
              </Button>
            </div>

            {loadingNews ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
                        className="overflow-hidden hover:shadow-xl transition-all duration-300 border-orange-200 cursor-pointer transform hover:scale-105"
                        onClick={() => openNewsDetail(item)}
                      >
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = getMusicDanceImage(item.title, item.category);
                            }}
                          />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {item.category}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg mb-2 text-orange-900 line-clamp-2">{item.title}</h3>
                          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{item.description}</p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-orange-600 hover:text-orange-800 p-0"
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
                    <HoverCardContent className="w-80 bg-white border-orange-200">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Music className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-orange-800">{item.category}</span>
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
            <Card className="border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-orange-800">Your Interests</CardTitle>
                <Button 
                  onClick={() => setIsEditInterestsOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 flex items-center gap-1"
                >
                  <Pencil className="h-4 w-4" /> Edit Interests
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-orange-700">Current Interests:</h4>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.interests.map((interest, index) => (
                      <Badge key={index} className="bg-orange-600 text-white flex items-center gap-1 pr-1">
                        {interest}
                        <button 
                          onClick={() => removeInterest(interest)}
                          className="ml-1 hover:bg-orange-700 rounded-full p-0.5 transition-colors"
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
                  <h4 className="font-semibold mb-2 text-orange-700">Preferred Categories:</h4>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.preferredCategories.map((category, index) => (
                      <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-orange-700">Quick Add Interests:</h4>
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
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
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
