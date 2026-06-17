import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Compass, Navigation, Home } from 'lucide-react'
import { toast } from 'sonner'

interface MockMapViewProps {
  isOpen: boolean
  onClose: () => void
  initialLocation: string
  onConfirmLocation: (location: string) => void
}

// Preset locations for simulated navigation
const PRESET_PLACES = [
  { name: '12 Maple St, Riverside', x: 230, y: 120, type: 'incident' },
  { name: 'Highway 101, Mile Marker 45', x: 420, y: 280, type: 'incident' },
  { name: 'Central Park Pond Area', x: 150, y: 220, type: 'incident' },
  { name: 'Abandoned Warehouse, East District', x: 340, y: 170, type: 'incident' },
  { name: 'Green Valley Sanctuary Woods', x: 80, y: 310, type: 'incident' },
  // Designated Shelters
  { name: 'Green Valley Sanctuary (124 Forest Rd, Green Valley)', x: 100, y: 90, type: 'shelter' },
  { name: 'Safe Haven Shelter (789 Oak Ave, Riverdale)', x: 290, y: 240, type: 'shelter' }
]

export function MockMapView({
  isOpen,
  onClose,
  initialLocation,
  onConfirmLocation
}: MockMapViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLoc, setSelectedLoc] = useState(initialLocation || 'Central Park Pond Area')
  const [hoverCoords, setHoverCoords] = useState<{ lat: string; lng: string } | null>(null)
  const [markerPos, setMarkerPos] = useState(() => {
    const preset = PRESET_PLACES.find((p) => p.name === initialLocation)
    return preset ? { x: preset.x, y: preset.y } : { x: 200, y: 150 }
  })

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)

    setMarkerPos({ x, y })
    const customAddress = `Coordinates [Lat: ${(52.3 + y / 1000).toFixed(4)}, Lng: ${(13.4 + x / 1000).toFixed(4)}]`
    setSelectedLoc(customAddress)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)
    const lat = (52.3 + y / 1000).toFixed(4)
    const lng = (13.4 + x / 1000).toFixed(4)
    setHoverCoords({ lat, lng })
  }

  const handleMouseLeave = () => {
    setHoverCoords(null)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const matched = PRESET_PLACES.find((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (matched) {
      setMarkerPos({ x: matched.x, y: matched.y })
      setSelectedLoc(matched.name)
      toast.success(`Located preset: ${matched.name}`)
    } else {
      const rx = Math.floor(Math.random() * 350) + 50
      const ry = Math.floor(Math.random() * 250) + 50
      setMarkerPos({ x: rx, y: ry })
      setSelectedLoc(`${searchQuery.trim()}, City Region`)
      toast.success(`Searched: "${searchQuery}"`)
    }
  }

  const handlePresetClick = (place: typeof PRESET_PLACES[0]) => {
    setMarkerPos({ x: place.x, y: place.y })
    setSelectedLoc(place.name)
  }

  const handleConfirm = () => {
    onConfirmLocation(selectedLoc)
    onClose()
  }

  const isShelter = PRESET_PLACES.find((p) => p.name === selectedLoc)?.type === 'shelter'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-2xl overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Navigation className='h-5 w-5 text-primary' /> Google Maps Dispatch Simulation
          </DialogTitle>
          <DialogDescription>
            Search an address or click anywhere on the interactive grid below to pin rescue coordinates.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className='flex items-center gap-2 mt-1'>
          <div className='relative flex-1'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search coordinates, addresses or presets (e.g. Central Park)...'
              className='pl-9 h-9'
            />
          </div>
          <Button type='submit' size='sm' className='h-9'>
            Search
          </Button>
        </form>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-2'>
          {/* Preset sidebar */}
          <div className='md:col-span-1 border rounded-lg p-2.5 bg-muted/40 text-xs space-y-3 h-[280px] overflow-y-auto'>
            <div>
              <p className='font-bold text-muted-foreground flex items-center gap-1 mb-1.5 uppercase tracking-wider text-[10px]'>
                <Compass className='h-3.5 w-3.5 text-rose-500' /> Incidents
              </p>
              <div className='space-y-1'>
                {PRESET_PLACES.filter((p) => p.type === 'incident').map((place) => (
                  <button
                    key={place.name}
                    type='button'
                    onClick={() => handlePresetClick(place)}
                    className={`w-full text-left p-1.5 rounded border transition-all hover:bg-accent text-[11px] ${
                      selectedLoc === place.name
                        ? 'bg-primary/10 text-primary border-primary/30 font-semibold shadow-sm'
                        : 'bg-background'
                    }`}
                  >
                    {place.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className='font-bold text-muted-foreground flex items-center gap-1 mb-1.5 uppercase tracking-wider text-[10px]'>
                <Home className='h-3.5 w-3.5 text-emerald-500' /> Shelter Hubs
              </p>
              <div className='space-y-1'>
                {PRESET_PLACES.filter((p) => p.type === 'shelter').map((place) => (
                  <button
                    key={place.name}
                    type='button'
                    onClick={() => handlePresetClick(place)}
                    className={`w-full text-left p-1.5 rounded border transition-all hover:bg-accent text-[11px] ${
                      selectedLoc === place.name
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold shadow-sm'
                        : 'bg-background'
                    }`}
                  >
                    {place.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map canvas */}
          <div
            className='md:col-span-3 border rounded-lg overflow-hidden bg-sky-50 dark:bg-sky-950/20 relative cursor-crosshair h-[280px] select-none transition-all duration-300 hover:shadow-inner'
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleMapClick}
          >
            {/* Map Grid Elements (Simulating SVG Map) */}
            <div
              className='absolute inset-0 pointer-events-none'
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            />

            {/* Simulating Landmass/Roads */}
            <div className='absolute top-4 left-6 w-32 h-14 bg-emerald-100 dark:bg-emerald-950/40 rounded-full blur-sm pointer-events-none' />
            <div className='absolute bottom-6 right-8 w-44 h-20 bg-emerald-100 dark:bg-emerald-950/40 rounded-full blur-sm pointer-events-none' />
            <div className='absolute inset-y-0 left-1/3 w-3 bg-slate-200 dark:bg-slate-800 rotate-12 opacity-60 pointer-events-none' />
            <div className='absolute inset-x-0 bottom-1/4 h-2.5 bg-slate-200 dark:bg-slate-800 -rotate-3 opacity-60 pointer-events-none' />
            <div className='absolute inset-y-0 right-1/4 w-8 bg-sky-200/50 dark:bg-sky-900/30 rounded-full blur-md pointer-events-none' />

            {/* Hotspot Presets Plotted on Canvas */}
            {PRESET_PLACES.map((p) => (
              <div
                key={p.name}
                className='absolute w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full border border-background shadow-sm pointer-events-none transition-all duration-300'
                style={{
                  left: p.x,
                  top: p.y,
                  backgroundColor: p.type === 'shelter' ? '#10b981' : '#f43f5e',
                  boxShadow: `0 0 8px ${p.type === 'shelter' ? '#10b981' : '#f43f5e'}`
                }}
              />
            ))}

            {/* Pulsing Marker */}
            <div
              className='absolute transition-all duration-300 ease-out pointer-events-none'
              style={{ left: markerPos.x - 16, top: markerPos.y - 32 }}
            >
              <div className='relative flex flex-col items-center'>
                <span className={`absolute inline-flex h-8 w-8 rounded-full animate-ping opacity-75 ${
                  isShelter ? 'bg-emerald-500/30' : 'bg-primary/30'
                }`} />
                <MapPin
                  className={`h-8 w-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-colors duration-300 ${
                    isShelter ? 'text-emerald-500' : 'text-primary'
                  }`}
                  fill='currentColor'
                />
              </div>
            </div>

            {/* Live coordinates HUD overlay */}
            {hoverCoords && (
              <div className='absolute top-2 right-2 bg-slate-950/90 text-white font-mono text-[10px] px-2 py-1 rounded border border-slate-800 shadow flex items-center gap-1.5 pointer-events-none transition-opacity duration-200'>
                <span className='h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse' />
                <span>Lat: {hoverCoords.lat}</span>
                <span>Lng: {hoverCoords.lng}</span>
              </div>
            )}

            {/* Map Click Instructions */}
            <div className='absolute bottom-2 left-2 bg-background/80 dark:bg-background/90 text-[10px] px-2 py-1 rounded border pointer-events-none font-medium'>
              Click map to dispatch coordinates.
            </div>
          </div>
        </div>

        {/* Selected Coordinates */}
        <div className={`flex items-center gap-2 p-2.5 border rounded-lg text-sm transition-all ${
          isShelter ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary/5 border-primary/10 text-primary'
        }`}>
          <MapPin className='h-4 w-4 shrink-0' />
          <span className='font-semibold shrink-0'>Selected Point:</span>
          <span className='truncate font-medium text-foreground'>{selectedLoc}</span>
        </div>

        <DialogFooter className='mt-2'>
          <Button variant='outline' size='sm' onClick={onClose}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleConfirm} className={isShelter ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''}>
            Use Pinned Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
