'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Twitter, Send } from 'lucide-react';
import Link from 'next/link';

const links = [
  {
    name: 'Discord',
    description: 'Join 5,000+ warriors',
    url: 'https://discord.com/invite/ZHtjbtpFXG',
    icon: MessageCircle,
    color: '#5865F2',
  },
  {
    name: 'Twitter/X',
    description: 'Follow @Ezzitrade',
    url: 'https://x.com/Ezzitrade',
    icon: Twitter,
    color: '#1DA1F2',
  },
  {
    name: 'Telegram',
    description: 'Join @ezziworld',
    url: 'https://t.me/ezziworld',
    icon: Send,
    color: '#0088cc',
  },
];

export function Community() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[#0a0a1a] to-[#02020a]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-['Rajdhani'] uppercase">
            Join the <span className="text-[#00d4ff]">Community</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Connect with thousands of warriors worldwide
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {links.map((link, index) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-8 bg-[#0a0a1a] rounded-2xl border border-white/10 hover:border-white/20 transition-all"
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto"
                  style={{ backgroundColor: `${link.color}20` }}
                >
                  <link.icon
                    className="w-8 h-8"
                    style={{ color: link.color }}
                  />
                </div>

                <h3 className="text-xl font-bold mb-2">{link.name}</h3>
                <p className="text-gray-400">{link.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
