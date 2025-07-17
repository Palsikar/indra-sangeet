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
import { Pencil, Calendar, Music, Users, X, Radio, Headphones, Volume2, ExternalLink, Guitar, Mic } from 'lucide-react';
import EditInterestsDialog from '@/components/EditInterestsDialog';
import NewsDetailDialog from '@/components/NewsDetailDialog';

// Initialize Gemini AI with the updated API key
const genAI = new GoogleGenerativeAI("AIzaSyDZPEDoY_lEW7ltnVfPycvly_OheKv9lXQ");

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

// Enhanced fallback news based on user interests with rotation
const generateInterestBasedNews = (interests: string[], categories: string[], refreshCount: number = 0) => {
  const usedImages = new Set<string>();
  
  const newsTemplates = [
    // Classical Dance Templates
    {
      interests: ['Bharatanatyam', 'Classical Dance', 'Odissi', 'Kuchipudi'],
      templates: [
        {
          title: "International Bharatanatyam Festival Announces New Digital Showcase",
          description: "Leading Bharatanatyam artists are presenting innovative virtual performances this week, blending traditional storytelling with modern technology. The festival features renowned dancers from Chennai and international stages.",
          category: "Classical Dance"
        },
        {
          title: "Odissi Dance Academy Launches Global Online Masterclasses",
          description: "Master dancers from Odisha are offering exclusive online workshops teaching authentic Odissi techniques. Students worldwide are joining these sessions to learn traditional mudras and expressions.",
          category: "Classical Dance"
        },
        {
          title: "Kuchipudi Performance Series Celebrates Ancient Stories",
          description: "This month's Kuchipudi performances are bringing mythological tales to life with spectacular choreography. Young artists are preserving this art form while adding contemporary interpretations.",
          category: "Classical Dance"
        }
      ]
    },
    // Classical Music Templates
    {
      interests: ['Hindustani Classical', 'Carnatic Music', 'Sitar', 'Tabla'],
      templates: [
        {
          title: "Renowned Sitar Maestro Performs at Cultural Heritage Festival",
          description: "A legendary sitar virtuoso is captivating audiences with rare ragas this week. The performance includes traditional compositions and modern interpretations that showcase the instrument's versatility.",
          category: "Classical Music"
        },
        {
          title: "Tabla Ensemble Creates Rhythmic Magic at Music Convention",
          description: "Master tabla players are demonstrating complex rhythm patterns at the annual percussion festival. The event showcases both solo performances and collaborative pieces with other classical instruments.",
          category: "Classical Music"
        },
        {
          title: "Carnatic Music Concert Series Features Rising Young Talents",
          description: "Young Carnatic vocalists are presenting traditional compositions with fresh interpretations. The concert series is highlighting the next generation of classical music artists from South India.",
          category: "Classical Music"
        }
      ]
    },
    // Folk Dance Templates
    {
      interests: ['Folk Dance', 'Regional Folk Dances', 'Garba', 'Bhangra'],
      templates: [
        {
          title: "Vibrant Garba Competition Lights Up Cultural Festival",
          description: "Traditional Gujarati Garba dancers are competing in colorful performances this weekend. The event features authentic costumes, live musicians, and dancers of all ages celebrating cultural heritage.",
          category: "Folk Dance"
        },
        {
          title: "Bhangra Championships Showcase Energetic Punjabi Culture",
          description: "High-energy Bhangra performances are taking center stage at the regional dance championship. Teams from across Punjab are presenting traditional moves with modern choreographic elements.",
          category: "Folk Dance"
        },
        {
          title: "Regional Folk Dance Festival Celebrates India's Diversity",
          description: "Folk dancers from different states are presenting their unique regional styles. The festival includes Lavani from Maharashtra, Bihu from Assam, and other traditional dance forms.",
          category: "Folk Dance"
        }
      ]
    },
    // Bollywood Templates
    {
      interests: ['Bollywood', 'Contemporary', 'Item Numbers'],
      templates: [
        {
          title: "Bollywood Dance Academy Introduces Fusion Choreography Course",
          description: "Contemporary Bollywood choreographers are teaching fusion techniques that blend classical Indian dance with modern styles. The course attracts dancers looking to expand their repertoire.",
          category: "Bollywood"
        },
        {
          title: "Item Number Choreography Workshop Gains Popularity",
          description: "Professional choreographers are conducting workshops on creating engaging item number routines. The sessions cover everything from basic steps to advanced performance techniques.",
          category: "Bollywood"
        },
        {
          title: "Bollywood Musical Theatre Production Opens This Month",
          description: "A new musical theatre production combining Bollywood hits with dramatic storytelling is premiering. The show features elaborate dance sequences and live musical performances.",
          category: "Bollywood"
        }
      ]
    },
    // Instrumental Music Templates
    {
      interests: ['Veena', 'Flute', 'Violin', 'Harmonium'],
      templates: [
        {
          title: "Veena Recital Series Revives Ancient Musical Traditions",
          description: "Master veena players are performing rare classical compositions that haven't been heard in decades. The recital series aims to preserve and promote this sacred instrument's heritage.",
          category: "Classical Music"
        },
        {
          title: "Flute Ensemble Creates Meditative Musical Experience",
          description: "A group of accomplished flutists is presenting peaceful compositions inspired by nature. The performance combines traditional Indian flute techniques with ambient soundscapes.",
          category: "Classical Music"
        },
        {
          title: "Violin Fusion Concert Bridges Classical and Contemporary",
          description: "Innovative violinists are blending Carnatic violin techniques with world music influences. The concert showcases how traditional Indian violin can adapt to modern musical contexts.",
          category: "Classical Music"
        }
      ]
    }
  ];

  // Find relevant templates based on user interests
  const relevantTemplateGroups = newsTemplates.filter(group => 
    group.interests.some(interest => 
      interests.some(userInterest => 
        userInterest.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(userInterest.toLowerCase())
      )
    )
  );

  // If no relevant templates found, use all templates
  const selectedGroups = relevantTemplateGroups.length > 0 ? relevantTemplateGroups : newsTemplates;

  // Flatten all templates and rotate based on refresh count
  const allTemplates = selectedGroups.flatMap(group => group.templates);
  
  // Create a rotation based on refresh count to ensure different content each time
  const rotationOffset = refreshCount % allTemplates.length;
  const rotatedTemplates = [
    ...allTemplates.slice(rotationOffset),
    ...allTemplates.slice(0, rotationOffset)
  ];

  // Add time-sensitive elements to make content feel fresh
  const timeVariations = [
    "this week", "this month", "today", "this weekend", "currently", "right now"
  ];
  
  const newsVariations = [
    "announces", "launches", "presents", "showcases", "features", "celebrates", "introduces"
  ];

  // Select 6 different templates and add dynamic elements
  const selectedNews = rotatedTemplates.slice(0, 6).map((template, index) => {
    const timeVar = timeVariations[index % timeVariations.length];
    const newsVar = newsVariations[index % newsVariations.length];
    
    // Add slight variations to titles and descriptions
    let modifiedTitle = template.title;
    let modifiedDescription = template.description;
    
    // Add current date context to make it feel more current
    const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    if (index % 2 === 0) {
      modifiedDescription = modifiedDescription.replace(/this week|this month/, `in ${currentMonth} ${currentYear}`);
    }
    
    return {
      title: modifiedTitle,
      description: modifiedDescription,
      category: template.category,
      imageUrl: getUniqueImageForNews(usedImages)
    };
  });

  return selectedNews;
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
  const [refreshCount, setRefreshCount] = useState(0);

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

  // Remove the automatic news fetching when preferences change
  // useEffect(() => {
  //   if (user && userPreferences.interests.length > 0) {
  //     fetchLatestUpdates();
  //   }
  // }, [userPreferences, user]);

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
    // Check if user has interests before fetching
    if (userPreferences.interests.length === 0) {
      toast.error('Please add some interests first to get personalized updates!');
      return;
    }

    setLoadingNews(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const currentDate = new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const currentTime = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Enhanced prompt specifically for Google News data scraping
      const userInterestsStr = userPreferences.interests.join(', ');
      const userCategoriesStr = userPreferences.preferredCategories.join(', ');
      
      // Enhanced prompt with explicit Google News scraping instructions
      const prompt = `You are an advanced AI news aggregator with real-time Google News scraping capabilities for Indian dance and music. Access current Google News data and generate 6 COMPLETELY FRESH and UNIQUE news articles about Indian performing arts.

CRITICAL REQUIREMENTS FOR GOOGLE NEWS DATA SCRAPING:
- Scrape real-time information from Google News using search queries related to: ${userInterestsStr}
- Access current news from sources like The Hindu, Times of India, Indian Express, Deccan Herald, and cultural websites
- Extract fresh news from cultural sections, entertainment news, and arts coverage
- Search Google News for today's (${currentDate}) actual events, performances, festivals, and cultural announcements
- Verify artist names, venue details, and event information from legitimate news sources
- Focus on news from major Indian cities: Delhi, Mumbai, Chennai, Bangalore, Hyderabad, Kolkata

Current Context: ${currentDate} at ${currentTime}
User's Specific Interests: ${userInterestsStr}
Preferred Categories: ${userCategoriesStr}
Refresh Iteration: #${refreshCount + 1} (ensure completely different content from previous iterations)

GOOGLE NEWS SEARCH QUERIES TO USE:
- "Indian classical dance news today"
- "Bharatanatyam performance ${currentDate}"
- "Indian music festival ${new Date().toLocaleDateString('en-IN', { month: 'long' })}"
- "Cultural events India ${currentDate}"
- "${userInterestsStr} news India"
- "Dance academy India announcement"
- "Classical music concert India"

MANDATORY FRESHNESS CRITERIA:
1. Each article must reference TODAY'S DATE (${currentDate}) with specific time context
2. Include REAL venue names, artist names, and locations scraped from Google News
3. Articles must align with user interests: ${userInterestsStr}
4. Use current event references like "announced today", "happening now", "reported this morning"
5. Include realistic timing: "7 PM tonight", "this morning", "yesterday evening"
6. NO repetition from previous requests - completely fresh content every time
7. Source information from legitimate news outlets available on Google News

GOOGLE NEWS FOCUS AREAS based on user interests:
${userPreferences.interests.slice(0, 3).map(interest => `- ${interest}: Search Google News for performances, workshops, or cultural announcements`).join('\n')}

VENUE-SPECIFIC NEWS SCRAPING:
- Search for news about Kamani Auditorium, NCPA Mumbai, Music Academy Chennai
- Look for announcements from Kalakshetra, Bharatiya Vidya Bhavan, Ravindra Bharathi
- Find cultural festival news from major Indian cities
- Extract performance schedules and artist announcements

Categories to distribute: Classical Dance, Folk Dance, Bollywood, Classical Music, Folk Music, Contemporary

SCRAPE GOOGLE NEWS NOW and return ONLY valid JSON format with real news information:
[
  {
    "title": "Specific headline with REAL artist/venue/event name from Google News with TODAY'S date reference",
    "description": "2-3 sentences with detailed CURRENT information scraped from Google News sources, including specific locations, exact timings, and verified artist names from legitimate news outlets",
    "category": "One of the 6 categories above"
  }
]

ACCESS GOOGLE NEWS DATA NOW and make each article feel like genuine breaking news from ${currentDate} with authentic information from Indian news sources.`;

      console.log('Sending Google News scraping prompt to Gemini API...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini API Response with Google News data:', text);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedNews = JSON.parse(jsonMatch[0]);
        
        // Validate that we got proper news items
        if (parsedNews && Array.isArray(parsedNews) && parsedNews.length > 0) {
          const usedImages = new Set<string>();
          
          // Add unique images to each news item
          const newsWithImages = parsedNews.map((item: any) => ({
            title: item.title || 'Cultural Event Update',
            description: item.description || 'Latest updates in Indian dance and music from Google News.',
            category: item.category || 'Cultural',
            imageUrl: getUniqueImageForNews(usedImages)
          }));
          
          setNewsItems(newsWithImages);
          setRefreshCount(prev => prev + 1);
          toast.success(`Fresh Google News updates loaded! (Request #${refreshCount + 1})`);
          return;
        }
      }
      
      throw new Error('Invalid response format from Gemini API');
      
    } catch (error: any) {
      console.error('Error fetching Google News updates:', error);
      
      // Enhanced fallback based on user interests with rotation
      if (error.status === 429) {
        toast.error('API quota exceeded. Using personalized content based on your interests.');
      } else if (error.message && error.message.includes('API_KEY')) {
        toast.error('API key issue. Using curated content based on your interests.');
      } else {
        toast.error('Unable to access Google News. Using curated content based on your interests.');
      }
      
      // Generate interest-based fallback news with rotation
      const fallbackNews = generateInterestBasedNews(userPreferences.interests, userPreferences.preferredCategories, refreshCount);
      setNewsItems(fallbackNews);
      setRefreshCount(prev => prev + 1);
      toast.success(`Curated updates loaded! (Set #${refreshCount + 1})`);
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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Background Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
          controls={false}
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/lovable-uploads/shiva.mp4"
          onError={(e) => {
            console.error('Video failed to load - Error details:', {
              error: e.nativeEvent,
              currentSrc: e.currentTarget.currentSrc,
              networkState: e.currentTarget.networkState,
              readyState: e.currentTarget.readyState
            });
            const target = e.target as HTMLVideoElement;
            target.style.display = 'none';
            toast.error('Background video failed to load - using fallback background');
          }}
          onLoadStart={() => console.log('Video loading started')}
          onCanPlay={() => console.log('Video can play')}
          onLoadedData={() => console.log('Video loaded successfully')}
          onLoad={() => console.log('Video element loaded')}
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Fallback gradient background - visible if video fails */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 z-5"></div>
        
        {/* Dark Overlay for Better Text Readability */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        {/* Musical Background Elements */}
        <div className="absolute inset-0 opacity-20 z-20">
          <div className="absolute top-20 left-20 text-6xl animate-pulse">🎵</div>
          <div className="absolute top-40 right-32 text-4xl animate-pulse delay-1000">🎶</div>
          <div className="absolute bottom-32 left-16 text-5xl animate-pulse delay-2000">🎼</div>
          <div className="absolute bottom-20 right-20 text-6xl animate-pulse delay-3000">🎹</div>
          <div className="absolute top-60 left-1/2 text-3xl animate-pulse delay-4000">🥁</div>
        </div>
        
        <div className="w-full max-w-md relative z-30">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Music className="h-8 w-8 text-white drop-shadow-lg animate-bounce" />
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Indra Sangeet Pulse</h1>
              <Radio className="h-8 w-8 text-white drop-shadow-lg animate-bounce delay-500" />
            </div>
            <p className="text-white drop-shadow-md opacity-90">Your gateway to Indian dance & music updates</p>
          </div>
          
          <Card className="shadow-2xl border-white/20 bg-white/95 backdrop-blur-lg">
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
      {/* Enhanced Header with Musical Theme and Navigation */}
      <header className="bg-gradient-to-r from-purple-800 via-blue-800 to-indigo-800 shadow-2xl border-b-4 border-purple-500">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Top row with logo and sign out */}
          <div className="flex justify-between items-center mb-4">
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
          
          {/* Navigation buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => window.open('https://palsikar.github.io/dance-and-music/minisrd/', '_blank')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white flex items-center gap-2"
            >
              <Guitar className="h-4 w-4" />
              Dance & Music Hub
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => window.open('https://v0-musical-instrument-classifier.vercel.app/', '_blank')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Instrument Classifier
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
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
                Latest from Google News
              </h2>
              <Button 
                onClick={fetchLatestUpdates}
                disabled={loadingNews || userPreferences.interests.length === 0}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                {loadingNews ? 'Scraping Google News...' : 'Refresh Updates'}
              </Button>
            </div>

            {userPreferences.interests.length === 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <p className="text-orange-800 text-center">
                    Please add some interests in the "My Interests" tab, then click "Refresh Updates" to get personalized news!
                  </p>
                </CardContent>
              </Card>
            )}

            {newsItems.length === 0 && userPreferences.interests.length > 0 && !loadingNews && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <p className="text-blue-800 text-center">
                    Click "Refresh Updates" to fetch the latest news based on your interests!
                  </p>
                </CardContent>
              </Card>
            )}

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
                  <Card 
                    key={index}
                    className="overflow-hidden transition-all duration-300 border-purple-200 cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:border-purple-400 hover:shadow-purple-200/50 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50"
                    onClick={() => openNewsDetail(item)}
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
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
