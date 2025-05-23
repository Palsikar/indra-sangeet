import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Pencil, ExternalLink } from 'lucide-react';
import EditInterestsDialog from '@/components/EditInterestsDialog';
import NewsDetailDialog from '@/components/NewsDetailDialog';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxe_0HnUbgET2zf3w0uvjxyisWU5rIi_E",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Gemini AI with the correct API key
const genAI = new GoogleGenerativeAI("AIzaSyDF5iTPenQShZq0lFf1_79pCXNjDOT5LA0");

interface NewsItem {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  source: string;
}

interface UserPreferences {
  interests: string[];
  preferredCategories: string[];
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    interests: ['classical dance', 'bollywood music'],
    preferredCategories: ['Bharatanatyam', 'Kathak', 'Hindustani Classical', 'Carnatic Music']
  });
  const [loadingNews, setLoadingNews] = useState(false);
  const [isEditInterestsOpen, setIsEditInterestsOpen] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [isNewsDetailOpen, setIsNewsDetailOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        toast.success('Welcome to Indra Sangeet Pulse!');
        fetchLatestUpdates();
      }
    });

    return () => unsubscribe();
  }, []);

  // Effect to refetch news when user preferences change
  useEffect(() => {
    if (user) {
      fetchLatestUpdates();
    }
  }, [userPreferences, user]);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Logged in successfully!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setNewsItems([]);
      toast.success('Signed out successfully!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchLatestUpdates = async () => {
    setLoadingNews(true);
    try {
      // Updated Gemini model configuration - use gemini-pro instead of gemini-1.0-pro
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `Generate 6 latest news updates about Indian dance and music in JSON format. Each update should include:
      - title: A compelling headline
      - description: 2-3 sentences describing the update
      - category: One of (Classical Dance, Folk Dance, Bollywood, Classical Music, Folk Music, Contemporary)
      - imageUrl: Use placeholder images from unsplash with relevant keywords
      - source: A credible source name
      
      Focus on topics like: ${userPreferences.interests.join(', ')}, ${userPreferences.preferredCategories.join(', ')}, recent performances, festivals, awards, new releases, cultural events.
      
      Return only valid JSON array format.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedNews = JSON.parse(jsonMatch[0]);
        setNewsItems(parsedNews);
      } else {
        // If no JSON is found, use fallback news items
        setNewsItems([
          {
            title: "Bharatanatyam Festival Returns to Chennai",
            description: "The annual Bharatanatyam festival showcases traditional and contemporary performances by renowned artists from across India.",
            category: "Classical Dance",
            imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
            source: "The Hindu"
          },
          {
            title: "New Bollywood Album Breaks Streaming Records",
            description: "Latest soundtrack featuring fusion of classical and modern elements reaches 10 million streams in first week.",
            category: "Bollywood",
            imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop",
            source: "Bollywood Hungama"
          },
          {
            title: "Kathak Master Class Series Announced",
            description: "International Kathak dancers to conduct virtual workshops for students worldwide this summer.",
            category: "Classical Dance",
            imageUrl: "https://images.unsplash.com/photo-1583224964623-033ed52c6b3b?w=400&h=250&fit=crop",
            source: "Dance India"
          },
          {
            title: "Carnatic Music Festival Celebrates 50th Anniversary",
            description: "The prestigious festival will feature legendary performers and emerging talents from across South India.",
            category: "Classical Music",
            imageUrl: "https://images.unsplash.com/photo-1514119412350-e174d90d280e?w=400&h=250&fit=crop",
            source: "Music Today"
          },
          {
            title: "National Folk Dance Competition Announces New Categories",
            description: "This year's competition will include regional folk styles from North-East India for the first time.",
            category: "Folk Dance",
            imageUrl: "https://images.unsplash.com/photo-1516280906200-bf71fe1b1e28?w=400&h=250&fit=crop",
            source: "Cultural Times"
          },
          {
            title: "Documentary on Hindustani Classical Masters Released",
            description: "The critically acclaimed film explores the lives and contributions of legendary Hindustani Classical musicians.",
            category: "Classical Music",
            imageUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=250&fit=crop",
            source: "Film Today"
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast.error('Failed to fetch latest updates');
      
      // Provide fallback news items in case of error
      setNewsItems([
        {
          title: "Bharatanatyam Festival Returns to Chennai",
          description: "The annual Bharatanatyam festival showcases traditional and contemporary performances by renowned artists from across India.",
          category: "Classical Dance",
          imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
          source: "The Hindu"
        },
        {
          title: "New Bollywood Album Breaks Streaming Records",
          description: "Latest soundtrack featuring fusion of classical and modern elements reaches 10 million streams in first week.",
          category: "Bollywood",
          imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop",
          source: "Bollywood Hungama"
        },
        {
          title: "Kathak Master Class Series Announced",
          description: "International Kathak dancers to conduct virtual workshops for students worldwide this summer.",
          category: "Classical Dance",
          imageUrl: "https://images.unsplash.com/photo-1583224964623-033ed52c6b3b?w=400&h=250&fit=crop",
          source: "Dance India"
        },
        {
          title: "Carnatic Music Festival Celebrates 50th Anniversary",
          description: "The prestigious festival will feature legendary performers and emerging talents from across South India.",
          category: "Classical Music",
          imageUrl: "https://images.unsplash.com/photo-1514119412350-e174d90d280e?w=400&h=250&fit=crop",
          source: "Music Today"
        }
      ]);
    } finally {
      setLoadingNews(false);
    }
  };

  const updatePreferences = (newInterest: string) => {
    if (!userPreferences.interests.includes(newInterest)) {
      setUserPreferences(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest]
      }));
      toast.success('Interest added to your preferences!');
    }
  };

  const saveUpdatedPreferences = (newPreferences: UserPreferences) => {
    setUserPreferences(newPreferences);
    fetchLatestUpdates();
  };

  const openNewsDetail = (item: NewsItem) => {
    setSelectedNewsItem(item);
    setIsNewsDetailOpen(true);
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
                  <Card 
                    key={index} 
                    className="overflow-hidden hover:shadow-lg transition-shadow border-orange-200 cursor-pointer"
                    onClick={() => openNewsDetail(item)}
                  >
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback image if the original fails to load
                          e.currentTarget.src = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=250&fit=crop";
                        }}
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          {item.category}
                        </Badge>
                        <span className="text-sm text-gray-500">{item.source}</span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-orange-900">{item.title}</h3>
                      <p className="text-gray-700 text-sm leading-relaxed">{item.description}</p>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-orange-600 hover:text-orange-800 p-0 flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          openNewsDetail(item);
                        }}
                      >
                        Read more <ExternalLink className="ml-1 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
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
                      <Badge key={index} className="bg-orange-600 text-white">
                        {interest}
                      </Badge>
                    ))}
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
                    {['Odissi', 'Kuchipudi', 'Manipuri', 'Mohiniyattam', 'Punjabi Folk', 'Qawwali'].map((interest) => (
                      <Button
                        key={interest}
                        variant="outline"
                        size="sm"
                        onClick={() => updatePreferences(interest)}
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
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
