import React, { useEffect, useState } from 'react'
import { assets, roomCommonData } from '../assets/assets'
import { useAppContext } from '../context/AppContext';
import { useParams } from 'react-router-dom';
import StarRating from '../components/StarRating';
import toast from 'react-hot-toast';

const RoomDetails = () => {
    const { id } = useParams();
    const { facilityIcons, rooms, getToken, axios, navigate } = useAppContext();

    const [room, setRoom] = useState(null);
    const [mainImage, setMainImage] = useState(null);
    const [checkInDate, setCheckInDate] = useState(null);
    const [checkOutDate, setCheckOutDate] = useState(null);
    const [guests, setGuests] = useState(1);

    const [isAvailable, setIsAvailable] = useState(false);
    const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi 👋 Let's negotiate the price." }
]);

const [input, setInput] = useState('');
const [attempt, setAttempt] = useState(1);

const [finalPrice, setFinalPrice] = useState(null);
const [dealDone, setDealDone] = useState(false);

    // Check if the Room is Available
    const checkAvailability = async () => {
        try {

            //  Check is Check-In Date is greater than Check-Out Date
            if (checkInDate >= checkOutDate) {
                toast.error('Check-In Date should be less than Check-Out Date')
                return;
            }

            const { data } = await axios.post('/api/bookings/check-availability', { room: id, checkInDate, checkOutDate })
            if (data.success) {
                if (data.isAvailable) {
                    setIsAvailable(true)
                    toast.success('Room is available')
                } else {
                    setIsAvailable(false)
                    toast.error('Room is not available')
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // onSubmitHandler function to check availability & book the room
    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            if (!isAvailable) {
                return checkAvailability();
            } else {
                const { data } = await axios.post('/api/bookings/book', { room: id, checkInDate, checkOutDate, guests,price: finalPrice || room.pricePerNight, paymentMethod: "Pay At Hotel" }, { headers: { Authorization: `Bearer ${await getToken()}` } })
                if (data.success) {
                    toast.success(data.message)
                    navigate('/my-bookings')
                    scrollTo(0, 0)
                } else {
                    toast.error(data.message)
                }
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const sendMessage = async () => {
    if (!input || isNaN(input) || Number(input) <= 0) {
    setMessages(prev => [
        ...prev,
        { sender: "bot", text: "⚠️ Valid price daalo" }
    ]);
    return;
}

    if (!input) return;


    if (attempt > 3) {
        setMessages(prev => [...prev, { sender: "bot", text: "❌ Negotiation closed" }]);
        return;
    }

    const userOffer = input;

    // 👤 user message
    setMessages(prev => [...prev, { sender: "user", text: `₹${userOffer}` }]);
    setInput('');

    // 🤖 typing
    setMessages(prev => [...prev, { sender: "bot", text: "..." }]);

    try {
        const { data } = await axios.post("/api/negotiate", {
            realPrice: room.pricePerNight,
            userOffer: Number(userOffer),
            attempt
        });

        setMessages(prev => {
            const updated = [...prev];
            updated.pop();

            let response;

            if (data.status === "counter") {
                response = `🤔 ${data.message}`;
            } 
            else if (data.status === "accept") {
                response = `🤝 ${data.message}`;
                setFinalPrice(data.finalPrice); // ⭐ MAIN LINE
                setDealDone(true);
            } 
            else {
                response = data.message;
            }

            return [...updated, { sender: "bot", text: response }];
        });

        if (data.status === "counter" || data.status === "accept") {
    setAttempt(prev => prev + 1);

    }
    }catch (error) {
    setMessages(prev => {
        const updated = [...prev];
        updated.pop();
        return [...updated, { sender: "bot", text: "⚠️ Server error" }];
    });


    // setAttempt(prev => prev + 1);
    
}
};
    useEffect(() => {
        const room = rooms.find(room => room._id === id);
        room && setRoom(room);
        room && setMainImage(room.images[0]);
    }, [rooms]);

    return room && (
        <div className='py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32'>

            {/* Room Details */}
            <div className='flex flex-col md:flex-row items-start md:items-center gap-2'>
                <h1 className='text-3xl md:text-4xl font-playfair'>{room.hotel.name} <span className='font-inter text-sm'>({room.roomType})</span></h1>
                <p className='text-xs font-inter py-1.5 px-3 text-white bg-orange-500 rounded-full'>20% OFF</p>
            </div>
            <div className='flex items-center gap-1 mt-2'>
                <StarRating />
                <p className='ml-2'>200+ reviews</p>
            </div>
            <div className='flex items-center gap-1 text-gray-500 mt-2'>
                <img src={assets.locationIcon} alt='location-icon' />
                <span>{room.hotel.address}</span>
            </div>

            {/* Room Images */}
            <div className='flex flex-col lg:flex-row mt-6 gap-6'>
                <div className='lg:w-1/2 w-full'>
                    <img className='w-full rounded-xl shadow-lg object-cover'
                        src={mainImage} alt='Room Image' />
                </div>

                <div className='grid grid-cols-2 gap-4 lg:w-1/2 w-full'>
                    {room?.images.length > 1 && room.images.map((image, index) => (
                        <img key={index} onClick={() => setMainImage(image)}
                            className={`w-full rounded-xl shadow-md object-cover cursor-pointer ${mainImage === image && 'outline-3 outline-orange-500'}`} src={image} alt='Room Image' />
                    ))}
                </div>
            </div>

            {/* Room Highlights */}
            <div className='flex flex-col md:flex-row md:justify-between mt-10'>
                <div className='flex flex-col'>
                    <h1 className='text-3xl md:text-4xl font-playfair'>Experience Luxury Like Never Before</h1>
                    <div className='flex flex-wrap items-center mt-3 mb-6 gap-4'>
                        {room.amenities.map((item, index) => (
                            <div key={index} className='flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100'>
                                <img src={facilityIcons[item]} alt={item} className='w-5 h-5' />
                                <p className='text-xs'>{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Room Price */}
                <p className='text-2xl font-medium'>${room.pricePerNight}/night</p>
                {finalPrice && (
  <div className="mt-2">
    <p className="text-green-600 font-semibold">
      Final Price: ₹{finalPrice}
    </p>
    <p className="text-sm text-gray-500">
      You saved ₹{room.pricePerNight - finalPrice} 🎉
    </p>
  </div>
)}
            </div>

            {/* CheckIn CheckOut Form */}
            <form onSubmit={onSubmitHandler} className='flex flex-col md:flex-row items-start md:items-center justify-between bg-white shadow-[0px_0px_20px_rgba(0,0,0,0.15)] p-6 rounded-xl mx-auto mt-16 max-w-6xl'>
                <div className='flex flex-col flex-wrap md:flex-row items-start md:items-center gap-4 md:gap-10 text-gray-500'>
                    <div className='flex flex-col'>
                        <label htmlFor='checkInDate' className='font-medium'>Check-In</label>
                        <input onChange={(e) => setCheckInDate(e.target.value)} id='checkInDate' type='date' min={new Date().toISOString().split('T')[0]} className='w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none' placeholder='Check-In' required />
                    </div>
                    <div className='w-px h-15 bg-gray-300/70 max-md:hidden'></div>
                    <div className='flex flex-col'>
                        <label htmlFor='checkOutDate' className='font-medium'>Check-Out</label>
                        <input onChange={(e) => setCheckOutDate(e.target.value)} id='checkOutDate' type='date' min={checkInDate} disabled={!checkInDate} className='w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none' placeholder='Check-Out' required />
                    </div>
                    <div className='w-px h-15 bg-gray-300/70 max-md:hidden'></div>
                    <div className='flex flex-col'>
                        <label htmlFor='guests' className='font-medium'>Guests</label>
                        <input onChange={(e) => setGuests(e.target.value)} value={guests} id='guests' type='number' className='max-w-20 rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none' placeholder='0' required />
                    </div>
                </div>
                <button type='submit' className='bg-primary hover:bg-primary-dull active:scale-95 transition-all text-white rounded-md max-md:w-full max-md:mt-6 md:px-25 py-3 md:py-4 text-base cursor-pointer'>{isAvailable ? "Book Now" : "Check Availability"}</button>
            </form>

            {/* 💬 NEGOTIATION CHAT UI */}
<div className="mt-10 max-w-md border rounded-xl shadow-md bg-white flex flex-col h-[420px]">

    {/* Header */}
    <div className="bg-green-500 text-white p-3 rounded-t-xl font-semibold">
        💬 Price Negotiation
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`px-3 py-2 rounded-lg text-sm ${
                    msg.sender === "user"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-800"
                }`}>
                    {msg.text}
                </div>
            </div>
        ))}
    </div>

    {/* Input */}
    <div className="p-3 border-t flex gap-2">
        <input
            type="number"
            value={input}
            disabled={dealDone}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your offer..."
            className="flex-1 border px-3 py-2 rounded-md outline-none"
        />

        <button
            onClick={sendMessage}
            disabled={dealDone}
            className="bg-green-500 text-white px-4 rounded-md hover:bg-green-600"
        >
            Send
        </button>
    </div>

</div>

            {/* Common Specifications */}
            <div className='mt-25 space-y-4'>                
                {roomCommonData.map((spec, index) => (
                    <div key={index} className='flex items-start gap-2'>
                        <img className='w-6.5' src={spec.icon} alt={`${spec.title}-icon`} />
                        <div>
                            <p className='text-base'>{spec.title}</p>
                            <p className='text-gray-500'>{spec.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className='max-w-3xl border-y border-gray-300 my-15 py-10 text-gray-500'>
                <p>Guests will be allocated on the ground floor according to availability. You get a comfortable Two bedroom apartment has a true city feeling. The price quoted is for two guest, at the guest slot please mark the number of guests to get the exact price for groups. The Guests will be allocated ground floor according to availability. You get the comfortable two bedroom apartment that has a true city feeling.</p>
            </div>

            <div className='flex flex-col items-start gap-4'>
                <div className='flex gap-4'>
                    <img className='h-14 w-14 md:h-18 md:w-18 rounded-full' src={room.hotel.owner.image} alt='Host' />
                    <div>
                        <p className='text-lg md:text-xl'>Hosted by {room.hotel.name}</p>
                        <div className='flex items-center mt-1'>
                            <StarRating />
                            <p className='ml-2'>200+ reviews</p>
                        </div>
                    </div>
                </div>
                <button className='px-6 py-2.5 mt-4 rounded text-white bg-primary hover:bg-primary-dull transition-all cursor-pointer'>
                    Contact Now
                </button>
            </div>
        </div>
    )
}

export default RoomDetails
