import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useReader } from '@/lib/reader-context';
import ePub, { Book, Rendition, Location } from 'epubjs';
import { 
  Settings2, 
  List as ListIcon, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Type,
  Sun,
  Moon,
  Coffee,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Reader() {
  const [, setLocation] = useLocation();
  const { fileBuffer, settings, updateSettings } = useReader();
  const viewerRef = useRef<HTMLDivElement>(null);
  
  const [book, setBook] = useState<Book | null>(null);
  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [toc, setToc] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [progress, setProgress] = useState(0);
  
  const [isTocOpen, setIsTocOpen] = useState(false);

  // Redirect if no file
  useEffect(() => {
    if (!fileBuffer) {
      setLocation('/');
    }
  }, [fileBuffer, setLocation]);

  // Init book and rendition
  useEffect(() => {
    if (!fileBuffer || !viewerRef.current) return;

    const newBook = ePub(fileBuffer);
    setBook(newBook);

    const newRendition = newBook.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      manager: 'continuous',
      snap: true,
    });

    setRendition(newRendition);

    newBook.loaded.navigation.then((nav) => {
      setToc(nav.toc);
    });

    newBook.ready.then(() => {
      newRendition.display();
      return newBook.locations.generate(1600);
    }).then((locations) => {
      // Generated locations for progress
    });

    newRendition.on('relocated', (location: Location) => {
      setCurrentLocation(location);
      if (newBook.locations.length() > 0) {
        const percentage = newBook.locations.percentageFromCfi(location.start.cfi);
        setProgress(Math.round(percentage * 100));
      }
    });

    return () => {
      newBook.destroy();
    };
  }, [fileBuffer]);

  // Apply settings
  useEffect(() => {
    if (!rendition) return;

    const { theme, fontFamily, fontSize, lineHeight, letterSpacing, marginWidth } = settings;

    // Apply basic CSS to iframe body
    rendition.themes.register('custom', {
      body: {
        background: 'transparent !important',
        color: 'inherit !important',
        'font-family': `${fontFamily} !important`,
        'line-height': `${lineHeight} !important`,
        'letter-spacing': `${letterSpacing}em !important`,
        padding: `0 ${marginWidth}px !important`,
      },
      p: {
        'font-family': `${fontFamily} !important`,
        'line-height': `${lineHeight} !important`,
      },
      'h1, h2, h3, h4, h5, h6': {
        'font-family': `${fontFamily} !important`,
      }
    });

    rendition.themes.select('custom');

  }, [rendition, settings]);

  const goToPrevPage = () => {
    rendition?.prev();
  };

  const goToNextPage = () => {
    rendition?.next();
  };

  const navigateToToc = (href: string) => {
    rendition?.display(href);
    setIsTocOpen(false);
  };

  if (!fileBuffer) return null;

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-background transition-colors duration-300">
      
      {/* Header / Toolbar */}
      <header className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-border/10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Sheet open={isTocOpen} onOpenChange={setIsTocOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" data-testid="button-toc">
                <ListIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 sm:w-96 p-0 flex flex-col">
              <SheetHeader className="p-6 pb-2 text-left">
                <SheetTitle className="font-serif text-xl">Table of Contents</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 px-4 py-4">
                <div className="space-y-1">
                  {toc.map((item, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      className="w-full justify-start text-left font-sans font-normal h-auto py-2 whitespace-normal"
                      onClick={() => navigateToToc(item.href)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" data-testid="button-settings">
                <Settings2 className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-4 space-y-6">
                
                {/* Theme */}
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Theme</Label>
                  <Tabs value={settings.theme} onValueChange={(v: any) => updateSettings({ theme: v })}>
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="white" className="gap-2">
                        <Sun className="h-4 w-4" /> Light
                      </TabsTrigger>
                      <TabsTrigger value="sepia" className="gap-2">
                        <Coffee className="h-4 w-4" /> Sepia
                      </TabsTrigger>
                      <TabsTrigger value="dark" className="gap-2">
                        <Moon className="h-4 w-4" /> Dark
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Separator />

                {/* Typography */}
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Typography</Label>
                  
                  <div className="space-y-2">
                    <Select value={settings.fontFamily} onValueChange={(v) => updateSettings({ fontFamily: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Font Family" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Palatino Linotype">Palatino Linotype</SelectItem>
                        <SelectItem value="Merriweather">Merriweather</SelectItem>
                        <SelectItem value="Lora">Lora</SelectItem>
                        <SelectItem value="Source Serif 4">Source Serif Pro</SelectItem>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="system-ui">System UI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Spacing */}
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Line Height</Label>
                      <span className="text-xs font-mono">{settings.lineHeight}</span>
                    </div>
                    <Slider 
                      min={1.2} max={2.5} step={0.1} 
                      value={[settings.lineHeight]} 
                      onValueChange={([v]) => updateSettings({ lineHeight: v })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
                      <span className="text-xs font-mono">{settings.letterSpacing}</span>
                    </div>
                    <Slider 
                      min={-0.05} max={0.2} step={0.01} 
                      value={[settings.letterSpacing]} 
                      onValueChange={([v]) => updateSettings({ letterSpacing: v })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Page Margin</Label>
                      <span className="text-xs font-mono">{settings.marginWidth}</span>
                    </div>
                    <Slider 
                      min={0} max={100} step={4} 
                      value={[settings.marginWidth]} 
                      onValueChange={([v]) => updateSettings({ marginWidth: v })}
                    />
                  </div>
                </div>

              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Reader Body */}
      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Nav Prev */}
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={goToPrevPage} className="h-full w-full rounded-none" data-testid="button-prev">
            <ChevronLeft className="h-8 w-8 text-muted-foreground" />
          </Button>
        </div>

        {/* Viewer Container */}
        <div className="w-full h-full max-w-4xl mx-auto flex flex-col relative px-4 sm:px-0">
          <div ref={viewerRef} className="flex-1 w-full h-full" id="viewer" />
        </div>

        {/* Nav Next */}
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={goToNextPage} className="h-full w-full rounded-none" data-testid="button-next">
            <ChevronRight className="h-8 w-8 text-muted-foreground" />
          </Button>
        </div>
      </main>

      {/* Footer / Progress */}
      <footer className="h-10 shrink-0 flex items-center justify-center text-xs text-muted-foreground font-sans border-t border-border/5">
        <span>{progress}% read</span>
      </footer>

    </div>
  );
}
