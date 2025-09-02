import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, Ticket, Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';
import { FaFacebook, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { supabase } from './supabaseClient'; // <-- Import supabase client

// Insert person into Supabase and return result
async function insertPerson(bookingData) {
  const { data, error } = await supabase
    .from('person')
    .insert([
      {
        full_name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
      },
    ])
    .select();

  return { data, error };
}

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    tickets: 1,
  });
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [ticketImage, setTicketImage] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const eventDetails = {
    title: 'REHA Event 2025',
    date: 'September 13, 2025',
    time: '7:00 PM - 11:00 PM',
    location: 'መሶብ ባህላዊ ሙዚቃ - ለም ሆቴል',
    price: 300,
    currency: 'ETB',
    description: 'Energetic, Raw live performance by highlighted artist "Nati(DON) & Mallo"',
    Artist: 'Nati(DON) & Mallo',
  };

  const ticketRef = useRef(null);

  // Function to get next sequential ticket number and save in localStorage
  const getNextTicketNumber = () => {
    const lastNumber = parseInt(localStorage.getItem('lastTicketNumber') || '0', 10);
    const nextNumber = lastNumber + 1;
    localStorage.setItem('lastTicketNumber', nextNumber.toString());
    return nextNumber;
  };

  const generateQRCode = async (ticketData) => {
    try {
      const qrData = JSON.stringify({
        ticketId: ticketData.id,
        eventName: eventDetails.title,
        attendeeName: ticketData.name,
        date: eventDetails.date,
        time: eventDetails.time,
        location: eventDetails.location,
        Artist: eventDetails.Artist,
      });

      return await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const handleBooking = async (e) => {
  e.preventDefault();

  if (!bookingData.name || !bookingData.email || !bookingData.phone) {
    toast({
      title: 'Missing Information',
      description: 'Please fill in all required fields.',
      variant: 'destructive',
    });
    return;
  }

  const { data, error } = await insertPerson(bookingData);

  if (error || !data || data.length === 0) {
    toast({
      title: 'Booking Failed',
      description: 'There was an error saving your ticket. Please try again.',
      variant: 'destructive',
    });
    return;
  }

  const person = data[0];
  const totalPrice = eventDetails.price * bookingData.tickets;

  const ticketData = {
    id: person.ticket_id, // Use ticket_id from your table
    name: person.full_name,
    email: person.email,
    phone: person.phone,
    tickets: bookingData.tickets, // For display only
    totalPrice: totalPrice,
    bookingDate: new Date().toLocaleDateString(),
    event: eventDetails,
  };

  const qrCode = await generateQRCode(ticketData);
  const ticketWithQR = { ...ticketData, qrCode };
  setGeneratedTicket(ticketWithQR);
  setIsBookingOpen(false);
  setIsTicketOpen(true);
  toast({
    title: 'Booking Successful! 🎉',
    description: `Your ticket has been saved. Ticket ID: ${ticketData.id}`,
  });

  setBookingData({
    name: '',
    email: '',
    phone: '',
    tickets: 1,
  });
};

  // Generate image from ticket DOM element and show preview
  const generateTicketImage = async () => {
    if (!ticketRef.current) {
      toast({
        title: 'Error',
        description: 'Ticket not ready for image generation.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use html2canvas to render the ticket DOM to canvas
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: null,
        scale: 2,
      });

      const image = canvas.toDataURL('image/png');
      setTicketImage(image);
      setPreviewOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate ticket image.',
        variant: 'destructive',
      });
      console.error(error);
    }
  };

  // Download the image previewed
  const downloadTicketImage = () => {
    if (!ticketImage) return;

    const a = document.createElement('a');
    a.href = ticketImage;
    a.download = `REHA-Ticket-${generatedTicket.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: 'Ticket Downloaded! 📱',
      description: 'Your ticket image has been saved to your device.',
    });

    setPreviewOpen(false);
    setIsTicketOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>REHA Events - Premium Event Ticket Reservations</title>
        <meta
          name="description"
          content="Book your tickets for REHA's exclusive events. Secure online reservations with instant QR code generation and ETB pricing."
        />
      </Helmet>

      <div className="min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect sticky top-0 z-50 px-6 py-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="./src/logo/Logo.png" alt="REHA Events Logo" className="h-12 w-auto" />
              <div>
                <h1 className="text-2xl font-bold gradient-text">REHA</h1>
                <p className="text-sm text-gray-300">Events</p>
              </div>
            </div>
            <Button
              onClick={() => setIsBookingOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Book Now
            </Button>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="relative px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <h2 className="text-5xl lg:text-7xl font-bold mb-6">
                  <span className="gradient-text">Premium</span>
                  <br />
                  Event Experience
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Secure your spot at REHA's most exclusive events. Instant booking, QR code tickets, and unforgettable
                  experiences await.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => setIsBookingOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105"
                  >
                    <Ticket className="w-5 h-5 mr-2" />
                    Reserve Your Ticket
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-full"
                    onClick={() =>
                      toast({
                        title:
                          "🚧 Event details feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
                      })
                    }
                  >
                    Learn More
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="float-animation">
                  <Card className="glass-effect p-8 ticket-pattern">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold gradient-text">{eventDetails.title}</h3>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-green-400">{eventDetails.price} ETB</p>
                          <p className="text-sm text-gray-400">per ticket</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-sm text-gray-400">Date</p>
                            <p className="font-semibold">{eventDetails.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-sm text-gray-400">Time</p>
                            <p className="font-semibold">{eventDetails.time}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-5 h-5 text-pink-400" />
                          <div>
                            <p className="text-sm text-gray-400">Location</p>
                            <p className="font-semibold">{eventDetails.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-sm text-gray-400">Artist</p>
                            <p className="font-semibold">{eventDetails.Artist}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h3 className="text-4xl font-bold mb-4">
                Why Choose <span className="gradient-text">REHA Events?</span>
              </h3>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Experience seamless booking with cutting-edge technology and premium service.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: QrCode,
                  title: 'Instant QR Tickets',
                  description: 'Get your unique QR code ticket instantly after booking. No waiting, no hassle.',
                  color: 'text-blue-400',
                },
                {
                  icon: Users,
                  title: 'Secure Reservations',
                  description: 'Your booking is protected with advanced security and instant confirmation.',
                  color: 'text-purple-400',
                },
                {
                  icon: Download,
                  title: 'Digital Convenience',
                  description: 'Download your tickets, access them offline, and present them at the venue.',
                  color: 'text-pink-400',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                >
                  <Card className="glass-effect p-8 h-full hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                    <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                    <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                    <p className="text-gray-300">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Dialog */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent className="glass-effect border-white/20 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold gradient-text">Book Your Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBooking} className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={bookingData.name}
                  onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingData.email}
                  onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={bookingData.phone}
                  onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tickets">Number of Tickets</Label>
                <Input
                  id="tickets"
                  type="number"
                  min="1"
                  max="10"
                  value={bookingData.tickets}
                  onChange={(e) => setBookingData({ ...bookingData, tickets: parseInt(e.target.value) })}
                  className="bg-white/10 border-white/30 text-white"
                />
              </div>

              <div className="bg-white/10 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-400">{eventDetails.price * bookingData.tickets} ETB</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-full transition-all duration-300"
              >
                Confirm Booking
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Ticket Display Dialog */}
        <Dialog open={isTicketOpen} onOpenChange={setIsTicketOpen}>
          <DialogContent className="glass-effect border-white/20 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold gradient-text text-center">Your Ticket</DialogTitle>
            </DialogHeader>

            {generatedTicket && (
              <div className="space-y-6">
                {/* Ticket card to capture as image */}
                <Card
                  ref={ticketRef}
                  className="ticket-gradient p-6 ticket-pattern relative"
                  style={{ width: '100%', maxWidth: 450, margin: '0 auto', borderRadius: 12, padding: 24 }}
                >
                  {/* Watermark and branding overlays */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      opacity: 0.1,
                      fontSize: 72,
                      fontWeight: 'bold',
                      color: '#ffffff',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      transform: 'rotate(-30deg)',
                      whiteSpace: 'nowrap',
                      zIndex: 0,
                    }}
                  >
                    REHA EVENTS
                  </div>

                  <div className="text-center space-y-4" style={{ position: 'relative', zIndex: 1 }}>
                    <img
                      src="https://storage.googleapis.com/hostinger-horizons-assets-prod/8a30e985-2a75-49e0-903f-a4cec521352b/31c4afa3e7fdf9e60683f6c772c4c983.png"
                      alt="REHA Logo"
                      className="h-16 w-auto mx-auto"
                    />
                    <h3 className="text-xl font-bold">{eventDetails.title}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-200">Name</p>
                        <p className="font-semibold">{generatedTicket.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-200">Tickets</p>
                        <p className="font-semibold">{generatedTicket.tickets}</p>
                      </div>
                      <div>
                        <p className="text-gray-200">Date</p>
                        <p className="font-semibold">{eventDetails.date}</p>
                      </div>
                      <div>
                        <p className="text-gray-200">Time</p>
                        <p className="font-semibold">{eventDetails.time}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-200 text-sm">Location</p>
                      <p className="font-semibold">{eventDetails.location}</p>
                    </div>
                    {generatedTicket.qrCode && (
                      <>
                        <p className="text-sm text-gray-300 mt-4">Scan this QR code at the venue:</p>
                        <img
                          src={generatedTicket.qrCode}
                          alt="Ticket QR Code"
                          className="mx-auto"
                          style={{ width: 150, height: 150 }}
                        />
                        <p className="text-xs text-gray-400 mt-2">Ticket ID: {generatedTicket.id}</p>
                      </>
                    )}
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button
                    onClick={generateTicketImage}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-full transition-all duration-300"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate & Download Image
                  </Button>
                  <Button
                    onClick={() => setIsTicketOpen(false)}
                    variant="outline"
                    className="flex-1 border-white/30 text-white hover:bg-white/10 py-2 rounded-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={() => setPreviewOpen(false)}>
          <DialogContent className="glass-effect border-white/20 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold gradient-text text-center">Ticket Image Preview</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-6">
              {ticketImage && (
                <img
                  src={ticketImage}
                  alt="Ticket Preview"
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                    userSelect: 'none',
                  }}
                />
              )}
              <div className="flex w-full gap-3">
                <Button
                  onClick={downloadTicketImage}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-full transition-all duration-300"
                >
                  Download Ticket Image
                </Button>
                <Button
                  onClick={() => setPreviewOpen(false)}
                  variant="outline"
                  className="flex-1 border-white/30 text-white hover:bg-white/10 py-3 rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Toaster />
        {/* Footer Section */}
<footer className="mt-20 bg-white/5 border-t border-white/10 text-white py-8">
  <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6 items-center text-sm">
    {/* Left: Copyright */}
    <div className="text-center md:text-left">
      &copy; {new Date().getFullYear()} REHA Events. All rights reserved.
    </div>

    {/* Center: Contact Info */}
    <div className="text-center">
      <p>
        📞 +251 939303919 &nbsp; | &nbsp; +251 900466222  
      </p>
      <p>
        📧 <a href="mailto:rehaevents263@gmail.com" className="text-blue-400 underline hover:text-blue-500">
          rehaevents263@gmail.com
        </a>
      </p>
    </div>

    <div className="flex justify-center md:justify-end gap-4">
      <a href="https://web.facebook.com/people/Reha-Events/61578703268696/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition">
        <FaFacebook className="w-5 h-5" />
      </a>
      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition">
        <FaInstagram className="w-5 h-5" />
      </a>
      <a href="https://www.youtube.com/channel/UCwwrCvLWk1he6PVX1MaGyLw" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition">
        <FaYoutube className="w-5 h-5" />
      </a>
      <a href="https://www.tiktok.com/@reha_event_and_promotion" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
        <FaTiktok className="w-5 h-5" />
      </a>
    </div>
  </div>
</footer>
      </div>
    </>
  );
}

export default App;