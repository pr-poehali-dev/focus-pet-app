import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type PetMood = 'happy' | 'focused' | 'sleep' | 'angry' | 'celebrate';
type TimerStatus = 'idle' | 'running' | 'paused';
type Tab = 'timer' | 'stats' | 'pets' | 'profile' | 'premium';

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

interface BigTask {
  id: string;
  title: string;
  subtasks: Subtask[];
  createdAt: number;
}

const MAX_FREE_TASKS = 4;

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
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [isPremium] = useState(false);
  const [bigTasks, setBigTasks] = useState<BigTask[]>([
    {
      id: '1',
      title: 'Выучить английский',
      subtasks: [
        { id: '1-1', text: 'Пройти урок 1', completed: true },
        { id: '1-2', text: 'Пройти урок 2', completed: true },
        { id: '1-3', text: 'Пройти урок 3', completed: false },
        { id: '1-4', text: 'Сдать тест', completed: false }
      ],
      createdAt: Date.now()
    }
  ]);
  const [activeTaskId, setActiveTaskId] = useState<string>('1');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const weekData = generateWeekData();
  const monthData = generateMonthData();

  const activeTask = bigTasks.find(t => t.id === activeTaskId);
  const completedSubtasks = activeTask?.subtasks.filter(st => st.completed).length || 0;
  const totalSubtasks = activeTask?.subtasks.length || 0;
  const taskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerStatus === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerStatus('idle');
            setPetMood('celebrate');
            setSessionsCompleted((s) => s + 1);
            if (activeTask && totalSubtasks > 0) {
              const currentSubtask = activeTask.subtasks.find(st => !st.completed);
              if (currentSubtask) {
                setBigTasks(prev => prev.map(task => 
                  task.id === activeTaskId 
                    ? {
                        ...task,
                        subtasks: task.subtasks.map(st => 
                          st.id === currentSubtask.id ? { ...st, completed: true } : st
                        )
                      }
                    : task
                ));
                toast.success(`Сессия завершена! "${currentSubtask.text}" выполнена! 🎉`);
              } else {
                toast.success('Сессия завершена! Отличная работа! 🎉');
              }
            } else {
              toast.success('Сессия завершена! Отличная работа! 🎉');
            }
            setTimeout(() => setPetMood('happy'), 1500);
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
        setShowRedFlash(true);
        setTimeout(() => setShowRedFlash(false), 1000);
        toast.error('Эй! Куда ушёл? Питомец злится! 😠');
      }
    };

    const checkInactivity = setInterval(() => {
      if (timerStatus === 'running' && Date.now() - lastActivity > 30000) {
        if (!isDistracted) {
          setIsDistracted(true);
          setPetMood('angry');
          setShowRedFlash(true);
          setTimeout(() => setShowRedFlash(false), 1000);
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
      case 'celebrate': return '🎉';
    }
  };

  const getPetLabel = () => {
    switch (petMood) {
      case 'happy': return 'Happy';
      case 'focused': return 'Focused';
      case 'sleep': return 'Sleep';
      case 'angry': return 'Angry!';
      case 'celebrate': return 'Success!';
    }
  };

  const getPetAnimation = () => {
    switch (petMood) {
      case 'angry': return 'animate-shake';
      case 'focused': return 'animate-pulse-glow';
      case 'celebrate': return 'animate-celebrate';
      default: return 'animate-bounce-in';
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error('Введите название задачи!');
      return;
    }
    
    if (!isPremium && bigTasks.length >= MAX_FREE_TASKS) {
      toast.error('В бесплатной версии доступно только 4 задачи. Оформите Premium!');
      setActiveTab('premium');
      return;
    }

    const newTask: BigTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      subtasks: [],
      createdAt: Date.now()
    };

    setBigTasks(prev => [...prev, newTask]);
    setActiveTaskId(newTask.id);
    setNewTaskTitle('');
    setShowTaskDialog(false);
    toast.success('Задача создана!');
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskText.trim()) {
      toast.error('Введите подзадачу!');
      return;
    }

    const newSubtask: Subtask = {
      id: `${taskId}-${Date.now()}`,
      text: newSubtaskText,
      completed: false
    };

    setBigTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, subtasks: [...task.subtasks, newSubtask] }
        : task
    ));
    setNewSubtaskText('');
    toast.success('Подзадача добавлена!');
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setBigTasks(prev => prev.map(task => 
      task.id === taskId 
        ? {
            ...task,
            subtasks: task.subtasks.map(st => 
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            )
          }
        : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setBigTasks(prev => prev.filter(t => t.id !== taskId));
    if (activeTaskId === taskId && bigTasks.length > 1) {
      setActiveTaskId(bigTasks.find(t => t.id !== taskId)?.id || '');
    }
    toast.success('Задача удалена!');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-secondary via-background to-muted transition-all duration-300 ${
      showRedFlash ? 'animate-red-flash' : ''
    }`}>
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        
        {activeTab === 'timer' && (
          <>
            {activeTask && (
              <Card className="p-4 shadow-lg border-0 bg-white/80 backdrop-blur">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground truncate flex-1">{activeTask.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTaskDialog(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Icon name="ChevronDown" size={16} />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="font-medium text-foreground">{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                    <Progress value={taskProgress} className="h-3" />
                  </div>

                  {totalSubtasks > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {activeTask.subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <button
                            onClick={() => handleToggleSubtask(activeTask.id, subtask.id)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              subtask.completed 
                                ? 'bg-primary border-primary' 
                                : 'border-muted-foreground'
                            }`}
                          >
                            {subtask.completed && (
                              <Icon name="Check" size={12} className="text-primary-foreground" />
                            )}
                          </button>
                          <span className={subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                            {subtask.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newSubtaskText}
                      onChange={(e) => setNewSubtaskText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(activeTask.id)}
                      placeholder="Добавить подзадачу..."
                      className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      onClick={() => handleAddSubtask(activeTask.id)}
                      size="sm"
                      className="bg-primary text-primary-foreground"
                    >
                      <Icon name="Plus" size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur">
              <div className="flex flex-col items-center space-y-6">
                
                <div className="relative">
                  <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${
                    petMood === 'angry' 
                      ? 'from-red-200 to-orange-200' 
                      : petMood === 'celebrate'
                      ? 'from-accent/30 to-accent/10'
                      : petMood === 'focused'
                      ? 'from-primary/30 to-primary/10'
                      : 'from-secondary to-muted'
                  } flex items-center justify-center transition-colors duration-300 ${
                    petMood === 'focused' ? 'animate-pulse-glow' : ''
                  }`}>
                    <div className={`text-7xl ${getPetAnimation()}`} key={petMood}>
                      {getPetEmoji()}
                    </div>
                  </div>
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 ${
                    petMood === 'angry' ? 'bg-red-100' : petMood === 'celebrate' ? 'bg-accent' : 'bg-white'
                  } rounded-full shadow-md transition-colors duration-300`}>
                    <span className={`text-xs font-medium ${
                      petMood === 'angry' ? 'text-red-600' : petMood === 'celebrate' ? 'text-accent-foreground font-bold' : 'text-muted-foreground'
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
                      className="flex-1 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
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
                        className="flex-1 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
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
                  <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center">
                    <Icon name="Trophy" size={24} className="text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Sessions Today</div>
                    <div className="text-2xl font-bold text-foreground">{sessionsCompleted}</div>
                  </div>
                </div>
                <div className="text-4xl">🍅</div>
              </div>
            </Card>
          </>
        )}

        {showTaskDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTaskDialog(false)}>
            <Card className="w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Мои задачи</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowTaskDialog(false)}>
                  <Icon name="X" size={20} />
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bigTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      activeTaskId === task.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setActiveTaskId(task.id);
                      setShowTaskDialog(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} выполнено
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {(!isPremium && bigTasks.length >= MAX_FREE_TASKS) ? (
                <div className="p-3 bg-accent/10 rounded-lg border border-accent">
                  <div className="text-sm text-foreground font-medium">
                    Лимит бесплатных задач: {bigTasks.length}/{MAX_FREE_TASKS}
                  </div>
                  <Button
                    onClick={() => {
                      setShowTaskDialog(false);
                      setActiveTab('premium');
                    }}
                    className="w-full mt-2 bg-primary text-primary-foreground"
                    size="sm"
                  >
                    Оформить Premium
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="Новая задача..."
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button onClick={handleAddTask} className="bg-primary text-primary-foreground">
                    <Icon name="Plus" size={20} />
                  </Button>
                </div>
              )}
            </Card>
          </div>
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
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent">
                  <div className="text-5xl mb-2">🐶</div>
                  <div className="text-xs font-medium text-foreground">Puppy</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary">
                  <div className="text-5xl mb-2">🐱</div>
                  <div className="text-xs font-medium text-foreground">Kitty</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-muted to-muted/50 border-2 border-muted opacity-50">
                  <div className="text-5xl mb-2">🐼</div>
                  <div className="text-xs font-medium text-foreground">Locked</div>
                  <Icon name="Lock" size={16} className="mx-auto mt-1 text-muted-foreground" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'profile' && (
          <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl">
                👤
              </div>
              <h2 className="text-2xl font-bold">Your Profile</h2>
              <div className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Achievement Level</div>
                  <div className="text-xl font-bold">Beginner 🌱</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-accent/20 rounded-lg border border-accent">
                    <div className="text-2xl mb-1">⭐</div>
                    <div className="text-xs text-foreground">First Session</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg opacity-50">
                    <Icon name="Lock" size={20} className="mx-auto mb-1 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">5 Sessions</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg opacity-50">
                    <Icon name="Lock" size={20} className="mx-auto mb-1 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Week Streak</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'premium' && (
          <Card className="p-8 shadow-lg border-0 bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur">
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
              <Button className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
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