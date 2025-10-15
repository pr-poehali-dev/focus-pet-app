import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type PetMood = 'happy' | 'focused' | 'sleep' | 'angry';
type TimerStatus = 'idle' | 'running' | 'paused';
type Tab = 'timer' | 'stats' | 'pets' | 'profile' | 'premium';

const FOCUS_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;

const generateWeekData = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      day: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
      sessions: Math.floor(Math.random() * 8) + 1
    };
  });
};

const generateMonthData = () => {
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      day: date.getDate(),
      sessions: Math.floor(Math.random() * 6) + 1
    };
  });
};

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');
  const [petMood, setPetMood] = useState<PetMood>('happy');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isDistracted, setIsDistracted] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [statsView, setStatsView] = useState<'week' | 'month'>('week');
  const weekData = generateWeekData();
  const monthData = generateMonthData();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerStatus === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerStatus('idle');
            setPetMood('happy');
            setSessionsCompleted((s) => s + 1);
            toast.success('Сессия завершена! Отличная работа! 🎉');
            return FOCUS_TIME;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [timerStatus, timeLeft]);

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (isDistracted && timerStatus === 'running') {
        setIsDistracted(false);
        setPetMood('focused');
        toast.success('Отлично! Продолжаем работать! 💪');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && timerStatus === 'running') {
        setIsDistracted(true);
        setPetMood('angry');
        toast.error('Эй! Куда ушёл? Питомец злится! 😠');
      }
    };

    const checkInactivity = setInterval(() => {
      if (timerStatus === 'running' && Date.now() - lastActivity > 30000) {
        if (!isDistracted) {
          setIsDistracted(true);
          setPetMood('angry');
          toast.error('Мышка не двигается! Ты там? 😤');
        }
      }
    }, 10000);

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(checkInactivity);
    };
  }, [timerStatus, lastActivity, isDistracted]);

  const handleStart = () => {
    setTimerStatus('running');
    setPetMood('focused');
    toast.success('Таймер запущен! Питомец следит за тобой 👀');
  };

  const handlePause = () => {
    setTimerStatus('paused');
    setPetMood('sleep');
  };

  const handleReset = () => {
    setTimerStatus('idle');
    setTimeLeft(FOCUS_TIME);
    setPetMood('happy');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100;

  const getPetEmoji = () => {
    switch (petMood) {
      case 'happy': return '🐶';
      case 'focused': return '🐱';
      case 'sleep': return '🐼';
      case 'angry': return '😡';
    }
  };

  const getPetLabel = () => {
    switch (petMood) {
      case 'happy': return 'Happy';
      case 'focused': return 'Focused';
      case 'sleep': return 'Sleep';
      case 'angry': return 'Angry!';
    }
  };

  const getPetAnimation = () => {
    switch (petMood) {
      case 'angry': return 'animate-shake';
      case 'focused': return 'animate-pulse-glow';
      default: return 'animate-bounce-in';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-orange-50">
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        
        {activeTab === 'timer' && (
          <>
            <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur">
              <div className="flex flex-col items-center space-y-6">
                
                <div className="relative">
                  <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${
                    petMood === 'angry' 
                      ? 'from-red-200 to-orange-200' 
                      : 'from-primary/20 to-secondary/20'
                  } flex items-center justify-center transition-colors duration-300 ${
                    petMood === 'focused' ? 'animate-pulse-glow' : ''
                  }`}>
                    <div className={`text-7xl ${getPetAnimation()}`} key={petMood}>
                      {getPetEmoji()}
                    </div>
                  </div>
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 ${
                    petMood === 'angry' ? 'bg-red-100' : 'bg-white'
                  } rounded-full shadow-md transition-colors duration-300`}>
                    <span className={`text-xs font-medium ${
                      petMood === 'angry' ? 'text-red-600' : 'text-muted-foreground'
                    }`}>{getPetLabel()}</span>
                  </div>
                </div>

                <div className="w-full">
                  <Progress 
                    value={progress} 
                    className="h-2 bg-muted"
                  />
                </div>

                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Focus Time
                  </div>
                  <div className="text-6xl font-bold">
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  {timerStatus === 'idle' && (
                    <Button 
                      onClick={handleStart}
                      className="flex-1 h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
                    >
                      Start
                    </Button>
                  )}
                  
                  {timerStatus === 'running' && (
                    <>
                      <Button 
                        onClick={handlePause}
                        variant="outline"
                        className="flex-1 h-14 text-lg font-semibold"
                      >
                        Pause
                      </Button>
                      <Button 
                        onClick={handleReset}
                        variant="outline"
                        className="h-14 px-6"
                      >
                        <Icon name="RotateCcw" size={20} />
                      </Button>
                    </>
                  )}
                  
                  {timerStatus === 'paused' && (
                    <>
                      <Button 
                        onClick={handleStart}
                        className="flex-1 h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
                      >
                        Resume
                      </Button>
                      <Button 
                        onClick={handleReset}
                        variant="outline"
                        className="h-14 px-6"
                      >
                        <Icon name="RotateCcw" size={20} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-lg border-0 bg-white/80 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Icon name="Trophy" size={24} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Sessions Today</div>
                    <div className="text-2xl font-bold">{sessionsCompleted}</div>
                  </div>
                </div>
                <div className="text-4xl">🍅</div>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4 pb-20">
            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur">
              <div className="flex justify-center gap-2 mb-6">
                <Button
                  variant={statsView === 'week' ? 'default' : 'outline'}
                  onClick={() => setStatsView('week')}
                  className="flex-1"
                >
                  Week
                </Button>
                <Button
                  variant={statsView === 'month' ? 'default' : 'outline'}
                  onClick={() => setStatsView('month')}
                  className="flex-1"
                >
                  Month
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">
                  {statsView === 'week' ? 'This Week' : 'This Month'}
                </h3>
                
                <div className="flex items-end justify-between gap-1 h-48 px-2">
                  {(statsView === 'week' ? weekData : monthData.slice(-14)).map((item, idx) => {
                    const maxSessions = Math.max(...(statsView === 'week' ? weekData : monthData).map(d => d.sessions));
                    const height = (item.sessions / maxSessions) * 100;
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                          style={{ height: `${height}%`, minHeight: '10%' }}
                          title={`${item.sessions} sessions`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {statsView === 'week' ? item.day : item.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                  <span className="text-sm font-medium">Total Sessions</span>
                  <span className="text-2xl font-bold text-primary">{sessionsCompleted}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg">
                  <span className="text-sm font-medium">Focus Time</span>
                  <span className="text-2xl font-bold text-secondary">
                    {Math.floor(sessionsCompleted * 25 / 60)}h {(sessionsCompleted * 25) % 60}m
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg">
                  <span className="text-sm font-medium">Avg per Day</span>
                  <span className="text-2xl font-bold text-accent">
                    {(sessionsCompleted / 7).toFixed(1)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'pets' && (
          <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur">
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold">Your Pets</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 border-2 border-orange-200">
                  <div className="text-5xl mb-2">🐶</div>
                  <div className="text-xs font-medium">Puppy</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-200">
                  <div className="text-5xl mb-2">🐱</div>
                  <div className="text-xs font-medium">Kitty</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-300 opacity-50">
                  <div className="text-5xl mb-2">🐼</div>
                  <div className="text-xs font-medium">Locked</div>
                  <Icon name="Lock" size={16} className="mx-auto mt-1" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'profile' && (
          <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl">
                👤
              </div>
              <h2 className="text-2xl font-bold">Your Profile</h2>
              <div className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Achievement Level</div>
                  <div className="text-xl font-bold">Beginner 🌱</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <div className="text-2xl mb-1">⭐</div>
                    <div className="text-xs">First Session</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg opacity-50">
                    <Icon name="Lock" size={20} className="mx-auto mb-1" />
                    <div className="text-xs">5 Sessions</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg opacity-50">
                    <Icon name="Lock" size={20} className="mx-auto mb-1" />
                    <div className="text-xs">Week Streak</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'premium' && (
          <Card className="p-8 shadow-lg border-0 bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur">
            <div className="text-center space-y-6">
              <div className="text-5xl">👑</div>
              <h2 className="text-2xl font-bold">Premium Features</h2>
              <ul className="space-y-3 text-left">
                <li className="flex items-center gap-3">
                  <Icon name="Check" size={20} className="text-primary" />
                  <span>Unlock all pets and avatars</span>
                </li>
                <li className="flex items-center gap-3">
                  <Icon name="Check" size={20} className="text-primary" />
                  <span>Advanced statistics & insights</span>
                </li>
                <li className="flex items-center gap-3">
                  <Icon name="Check" size={20} className="text-primary" />
                  <span>Custom timer intervals</span>
                </li>
                <li className="flex items-center gap-3">
                  <Icon name="Check" size={20} className="text-primary" />
                  <span>Desktop app monitoring</span>
                </li>
              </ul>
              <Button className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                Upgrade Now
              </Button>
            </div>
          </Card>
        )}

        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t shadow-lg">
          <div className="container max-w-md mx-auto">
            <div className="flex justify-around py-3">
              <button
                onClick={() => setActiveTab('timer')}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'timer' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Clock" size={24} />
                <span className="text-xs font-medium">Timer</span>
              </button>
              
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'stats' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon name="BarChart3" size={24} />
                <span className="text-xs font-medium">Stats</span>
              </button>
              
              <button
                onClick={() => setActiveTab('pets')}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'pets' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Heart" size={24} />
                <span className="text-xs font-medium">Pets</span>
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon name="User" size={24} />
                <span className="text-xs font-medium">Profile</span>
              </button>
              
              <button
                onClick={() => setActiveTab('premium')}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'premium' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon name="Crown" size={24} />
                <span className="text-xs font-medium">Premium</span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}