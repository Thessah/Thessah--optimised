"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "../assets/logo/logo.png";

const Footer = () => {
    const [footerSections, setFooterSections] = useState([
        {
            title: "Useful Links",
            links: [
                { name: "Delivery Information", link: '/delivery-information' },
                { name: "International Shipping", link: '/international-shipping' },
                { name: "Payment Options", link: '/payment-options' },
                { name: "Track your Order", link: '/track-order' },
                { name: "Returns", link: '/returns' },
                { name: "Find a Store", link: '/find-store' },
            ]
        },
        {
            title: "Information",
            links: [
                { name: "Blog", link: '/blog' },
                { name: "Offers & Contest Details", link: '/offers' },
                { name: "Help & FAQs", link: '/help' },
                { name: "About Tanishq", link: '/about-us' },
            ]
        },
        {
            title: "Contact Us",
            links: [
                { name: "1800-266-0123", link: "tel:1800-266-0123", isPhone: true },
                { name: "Chat With Us", link: "/chat", isChat: true },
                { name: "+91 8147349242", link: "tel:+918147349242", isPhone: true },
            ]
        }
    ]);

    useEffect(() => {
        const fetchFooterMenu = async () => {
            try {
                const settingsRes = await fetch('/api/store/settings');
                const settingsData = await settingsRes.json();
                if (settingsData.settings?.footerSections) {
                    setFooterSections(settingsData.settings.footerSections);
                }
            } catch (error) {
                console.error('Error fetching footer menu:', error);
            }
        };
        
        fetchFooterMenu();
        
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchFooterMenu, 30000);
        return () => clearInterval(interval);
    }, []);

    const InstagramIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="16.5" cy="7.5" r="1" fill="currentColor"/></svg>)
    const TwitterIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 5.92a8.62 8.62 0 0 1-2.49.68 4.34 4.34 0 0 0 1.9-2.4 8.67 8.67 0 0 1-2.75 1.05 4.33 4.33 0 0 0-7.37 3.95A12.3 12.3 0 0 1 2.4 4.62a4.33 4.33 0 0 0 1.34 5.77 4.3 4.3 0 0 1-1.96-.54v.05a4.33 4.33 0 0 0 3.47 4.24 4.34 4.34 0 0 1-1.95.07 4.33 4.33 0 0 0 4.04 3A8.68 8.68 0 0 1 2 19.54a12.24 12.24 0 0 0 6.63 1.94c7.96 0 12.3-6.59 12.3-12.3 0-.19 0-.37-.01-.56A8.8 8.8 0 0 0 23 6.67a8.62 8.62 0 0 1-2.49.68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
    const FacebookIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
    const YoutubeIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="m9.75 15.02 5.75-3.27-5.75-3.27v6.54z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
    const WhatsAppIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
    const EmailIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="m22 6-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)
    const ChatIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>)

    const socialIcons = [
        { icon: InstagramIcon, link: "https://www.instagram.com/thessah/" },
        { icon: TwitterIcon, link: "https://twitter.com/thessah" },
        { icon: FacebookIcon, link: "https://www.facebook.com/profile.php?id=61584513867192" },
        { icon: YoutubeIcon, link: "https://www.youtube.com/@thessah" },
    ];

    const paymentIcons = ['VISA', 'Mastercard', 'Maestro', 'PayPal', 'Diners Club', 'American Express'];

    return (
        <footer className="bg-[#008C6D] text-white py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
                    {/* Brand Section */}
                    <div>
                        <Link href="/" className="inline-block mb-6">
                            <Image
                                src={Logo}
                                alt="Logo"
                                width={220}
                                height={55}
                                className="object-contain brightness-0 invert"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Dynamic Footer Sections */}
                    {footerSections.map((section, index) => (
                        <div key={index}>
                            <h3 className="text-white font-semibold text-base mb-6">
                                {section.title}
                            </h3>
                            <ul className="space-y-3">
                                {section.links && section.links.map((link, i) => (
                                    <li key={i}>
                                        {link.isPhone ? (
                                            <a 
                                                href={link.link} 
                                                className="text-sm text-white/80 hover:text-white transition inline-block"
                                            >
                                                {link.name}
                                            </a>
                                        ) : link.isChat ? (
                                            <Link 
                                                href={link.link} 
                                                className="text-sm text-white/80 hover:text-white transition inline-flex items-center gap-2"
                                            >
                                                <ChatIcon />
                                                {link.name}
                                            </Link>
                                        ) : (
                                            <Link 
                                                href={link.link} 
                                                className="text-sm text-white/80 hover:text-white transition inline-block"
                                            >
                                                {link.name}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="border-t border-white/20 mb-8"></div>

                {/* Bottom Section */}
                <div className="space-y-6">
                    {/* Social Icons */}
                    <div>
                        <h4 className="text-white font-medium mb-4">Social</h4>
                        <div className="flex items-center gap-4">
                            {socialIcons.map((item, i) => (
                                <Link 
                                    href={item.link} 
                                    key={i} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-white/70 hover:text-white transition"
                                >
                                    <item.icon />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Payment Icons */}
                    <div className="flex flex-wrap items-center gap-3">
                        {paymentIcons.map((payment, i) => (
                            <div 
                                key={i} 
                                className="bg-white/10 px-3 py-1.5 rounded text-xs text-white/80"
                            >
                                {payment}
                            </div>
                        ))}
                    </div>

                    {/* Copyright */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-white/20">
                        <p className="text-sm text-white/70">
                            © {new Date().getFullYear()} Thessah. All Rights Reserved.
                        </p>
                        <div className="flex gap-6">
                            <Link href="/terms" className="text-sm text-white/70 hover:text-white transition">
                                Terms & Conditions
                            </Link>
                            <Link href="/privacy" className="text-sm text-white/70 hover:text-white transition">
                                Privacy Policy
                            </Link>
                            <Link href="/disclaimer" className="text-sm text-white/70 hover:text-white transition">
                                Disclaimer
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;