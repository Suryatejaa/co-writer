import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Container from '../components/ui/Container';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const navLinks = [
        { name: 'Home', to: '/' },
        { name: 'Contribute', to: '/contribute' },
    ];

    const menuVariants = {
        open: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
        closed: { opacity: 0, y: -20, transition: { duration: 0.2 } },
    };

    const linkVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.3
            }
        })
    };

    return (
        <header className="frosted-header py-4 sticky top-0 z-50">
            <Container className="flex justify-between items-center relative">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Link
                        to="/"
                        className="text-2xl font-bold text-black hover:text-grey/800 transition drop-shadow-md"
                    >
                        🎬 ReelScript AI
                    </Link>
                </motion.div>

                {/* Desktop Navigation */}
                <nav aria-label="Primary" className="hidden sm:block">
                    <ul className="flex items-center space-x-6 list-none m-0 p-0">
                        {navLinks.map((link, index) => (
                            <motion.li
                                key={link.name}
                                variants={linkVariants}
                                initial="hidden"
                                animate="visible"
                                custom={index + 1}
                            >
                                <Link
                                    to={link.to}
                                    className="text-black hover:text-white/80 transition font-medium text-lg"
                                >
                                    {link.name}
                                </Link>
                            </motion.li>
                        ))}
                    </ul>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="sm:hidden text-white hover:text-white/80 transition z-50"
                    aria-label="Toggle navigation menu"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={isMenuOpen ? "x" : "menu"}
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </motion.div>
                    </AnimatePresence>
                </button>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            {/* Fullscreen blurred backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-black/30 backdrop-blur-md sm:hidden z-40"
                                onClick={toggleMenu}
                                aria-hidden="true"
                            />

                            {/* Glassy dropdown panel */}
                            <motion.nav
                                variants={menuVariants}
                                initial="closed"
                                animate="open"
                                exit="closed"
                                className="absolute top-full left-0 w-full mt-4 sm:hidden z-50"
                                aria-label="Mobile primary navigation"
                            >
                                <div className="mx-4 rounded-2xl border border-white/20 bg-white/15 bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] p-4">
                                    <ul className="flex flex-col space-y-4 list-none m-0 p-0">
                                        {navLinks.map((link, index) => (
                                            <motion.li
                                                key={link.name}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 * index, duration: 0.3 }}
                                            >
                                                <Link
                                                    to={link.to}
                                                    onClick={toggleMenu}
                                                    className="block text-white hover:text-white/80 transition font-medium text-lg py-2"
                                                >
                                                    {link.name}
                                                </Link>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.nav>
                        </>
                    )}
                </AnimatePresence>
            </Container>
        </header>
    );
};

export default Header;