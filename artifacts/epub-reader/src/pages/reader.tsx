import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useReader } from '@/lib/reader-context';
import ePub, { Rendition, Location } from 'epubjs';
import {
  Settings2,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Sun,
  Moon,
  Coffee,
  BookOpen,
  Columns2,
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
  const containerRef = useRef<HTMLDivElement>(null);

  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [toc, setToc] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [isTocOpen, setIsTocOpen] = useState(false);

  // Persists reading position across rendition recreations (view mode switch)
  const lastCfiRef = useRef<string | null>(null);
  // Stable ref so the resize effect doesn't trigger rendition recreation
  const pageViewRef = useRef(settings.pageView);
  useEffect(() => { pageViewRef.current = settings.pageView; }, [settings.pageView]);

  // Redirect if no file loaded
  useEffect(() => {
    if (!fileBuffer) setLocation('/');
  }, [fileBuffer, setLocation]);

  // Create book + rendition together. Re-runs when file or page-view mode changes.
  useEffect(() => {
    if (!fileBuffer || !viewerRef.current) return;

    const spread = pageViewRef.current === 'double' ? 'auto' : 'none';

    const book = ePub(fileBuffer);

    const rend = book.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      manager: 'default',
      spread,
    });

    setRendition(rend);

    book.loaded.navigation.then((nav) => {
      setToc(nav.toc);
    });

    book.ready.then(() => {
      const cfi = lastCfiRef.current;
      return cfi ? rend.display(cfi) : rend.display();
    }).then(() => {
      book.locations.generate(1600);
    });

    rend.on('relocated', (location: Location) => {
      if (location?.start?.cfi) {
        lastCfiRef.current = location.start.cfi;
      }
      if (book.locations.length() > 0) {
        const pct = book.locations.percentageFromCfi(location.start.cfi);
        setProgress(Math.round(pct * 100));
      }
    });

    return () => {
      book.destroy();
      setRendition(null);
    };
  // pageView change re-runs via the trigger state below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileBuffer, settings.pageView]);

  // Apply typography + theme settings into the epub iframe
  useEffect(() => {
    if (!rendition) return;

    const themeColors: Record<string, { bg: string; color: string }> = {
      white: { bg: '#ffffff', color: '#1c1008' },
      sepia: { bg: '#f4ecd8', color: '#3b2a1a' },
      dark:  { bg: '#1a1a1a', color: '#e8e0d0' },
    };
    const { bg, color } = themeColors[settings.theme] ?? themeColors.white;

    rendition.themes.register('custom', {
      body: {
        background: `${bg} !important`,
        color: `${color} !important`,
        'font-family': `${settings.fontFamily}, Georgia, serif !important`,
        'line-height': `${settings.lineHeight} !important`,
        'letter-spacing': `${settings.letterSpacing}em !important`,
      },
      p: {
        'font-family': `${settings.fontFamily}, Georgia, serif !important`,
        'line-height': `${settings.lineHeight} !important`,
        'letter-spacing': `${settings.letterSpacing}em !important`,
      },
      'h1, h2, h3, h4, h5, h6': {
        'font-family': `${settings.fontFamily}, Georgia, serif !important`,
      },
    });

    rendition.themes.select('custom');
  }, [rendition, settings.theme, settings.fontFamily, settings.lineHeight, settings.letterSpacing]);

  // When margin changes, let CSS transition finish then tell epubjs the new size
  useEffect(() => {
    if (!rendition || !containerRef.current) return;
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        rendition.resize(w, h);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [rendition, settings.marginWidth]);

  const goToPrevPage = useCallback(() => rendition?.prev(), [rendition]);
  const goToNextPage = useCallback(() => rendition?.next(), [rendition]);

  const navigateToToc = (href: string) => {
    rendition?.display(href);
    setIsTocOpen(false);
  };

  if (!fileBuffer) return null;

  // Margin controls the text column width: 0 = full width, 100 = ~50% width, centred
  const textWidthPct = Math.max(40, 100 - settings.marginWidth * 0.5);

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden bg-background transition-colors duration-300">

      {/* Toolbar */}
      <header className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-border/10">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            onClick={() => setLocation('/')}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Sheet open={isTocOpen} onOpenChange={setIsTocOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-toc"
              >
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
                      data-testid={`toc-item-${i}`}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-settings"
              >
                <Settings2 className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-4 space-y-5">

                {/* Theme */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Theme</Label>
                  <Tabs value={settings.theme} onValueChange={(v: any) => updateSettings({ theme: v })}>
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="white" className="gap-1.5" data-testid="theme-white">
                        <Sun className="h-3.5 w-3.5" /> Light
                      </TabsTrigger>
                      <TabsTrigger value="sepia" className="gap-1.5" data-testid="theme-sepia">
                        <Coffee className="h-3.5 w-3.5" /> Sepia
                      </TabsTrigger>
                      <TabsTrigger value="dark" className="gap-1.5" data-testid="theme-dark">
                        <Moon className="h-3.5 w-3.5" /> Dark
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Separator />

                {/* Page View */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Page View</Label>
                  <Tabs value={settings.pageView} onValueChange={(v: any) => updateSettings({ pageView: v })}>
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="single" className="gap-1.5" data-testid="view-single">
                        <BookOpen className="h-3.5 w-3.5" /> Single
                      </TabsTrigger>
                      <TabsTrigger value="double" className="gap-1.5" data-testid="view-double">
                        <Columns2 className="h-3.5 w-3.5" /> Double
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Separator />

                {/* Font */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Font</Label>
                  <Select value={settings.fontFamily} onValueChange={(v) => updateSettings({ fontFamily: v })}>
                    <SelectTrigger data-testid="select-font">
                      <SelectValue placeholder="Font Family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Palatino Linotype">Palatino</SelectItem>
                      <SelectItem value="Merriweather">Merriweather</SelectItem>
                      <SelectItem value="Lora">Lora</SelectItem>
                      <SelectItem value="Source Serif 4">Source Serif</SelectItem>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="system-ui">System UI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Spacing */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Line Height</Label>
                      <span className="text-xs font-mono text-muted-foreground">{settings.lineHeight.toFixed(1)}</span>
                    </div>
                    <Slider
                      min={1.2} max={2.5} step={0.1}
                      value={[settings.lineHeight]}
                      onValueChange={([v]) => updateSettings({ lineHeight: v })}
                      data-testid="slider-line-height"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
                      <span className="text-xs font-mono text-muted-foreground">{settings.letterSpacing.toFixed(2)}em</span>
                    </div>
                    <Slider
                      min={-0.05} max={0.2} step={0.01}
                      value={[settings.letterSpacing]}
                      onValueChange={([v]) => updateSettings({ letterSpacing: v })}
                      data-testid="slider-letter-spacing"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Text Width</Label>
                      <span className="text-xs font-mono text-muted-foreground">{Math.round(textWidthPct)}%</span>
                    </div>
                    <Slider
                      min={0} max={100} step={4}
                      value={[settings.marginWidth]}
                      onValueChange={([v]) => updateSettings({ marginWidth: v })}
                      data-testid="slider-margin"
                    />
                  </div>
                </div>

              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Reader Body */}
      <main className="flex-1 relative flex items-stretch overflow-hidden">

        {/* Nav Prev */}
        <div className="shrink-0 w-10 sm:w-14 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10">
          <Button
            variant="ghost" size="icon"
            onClick={goToPrevPage}
            className="h-full w-full rounded-none"
            data-testid="button-prev"
          >
            <ChevronLeft className="h-7 w-7 text-muted-foreground" />
          </Button>
        </div>

        {/* Centred viewer — width controls text line length */}
        <div className="flex-1 h-full flex items-stretch justify-center overflow-hidden">
          <div
            ref={containerRef}
            className="h-full transition-[width] duration-200"
            style={{ width: `${textWidthPct}%` }}
          >
            <div ref={viewerRef} className="w-full h-full" id="viewer" />
          </div>
        </div>

        {/* Nav Next */}
        <div className="shrink-0 w-10 sm:w-14 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10">
          <Button
            variant="ghost" size="icon"
            onClick={goToNextPage}
            className="h-full w-full rounded-none"
            data-testid="button-next"
          >
            <ChevronRight className="h-7 w-7 text-muted-foreground" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-9 shrink-0 flex items-center justify-center text-xs text-muted-foreground font-sans border-t border-border/5">
        <span data-testid="text-progress">{progress > 0 ? `${progress}% read` : ''}</span>
      </footer>
    </div>
  );
}
