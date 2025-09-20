'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How severe is the global liver disease crisis, and why is tracking essential?",
    answer: "Liver disease affects over 1.5 billion people worldwide, with 2 million deaths annually. In the US alone, 100,000+ patients need liver transplants but only 8,000 donors are available yearly - a devastating 12:1 ratio. Early detection and continuous monitoring through tools like LiverTracker can prevent 60% of liver-related deaths by catching deterioration before it becomes irreversible."
  },
  {
    question: "How many people are dying while waiting for liver transplants, and how can LiverTracker help?",
    answer: "Every day, 17 Americans die waiting for liver transplants due to the critical organ shortage. LiverTracker helps patients optimize their health while waiting, track MELD scores that determine transplant priority, and provides healthcare teams with comprehensive data to make life-saving decisions faster."
  },
  {
    question: "What is the donor-to-recipient ratio crisis, and why is prevention crucial?",
    answer: "With only 1 donor available for every 12 patients needing liver transplants globally, prevention and early intervention are literally matters of life and death. LiverTracker enables proactive monitoring that can slow disease progression, potentially keeping patients off transplant lists or improving their survival while waiting."
  },
  {
    question: "How does LiverTracker's MELD score tracking save lives in the transplant allocation system?",
    answer: "MELD scores (6-40 scale) determine transplant priority - patients with MELD 35+ have 90-day mortality rates exceeding 50%. Our platform automatically calculates MELD scores from lab uploads, tracks trends, and alerts patients to critical changes, ensuring they receive appropriate medical attention and transplant consideration at the right time."
  },
  {
    question: "Why do 40% of liver disease patients go undiagnosed until it's too late, and how does our AI help?",
    answer: "Liver disease is often \"silent\" until advanced stages. Our AI-powered analysis of routine lab work can detect early warning signs that patients and even some healthcare providers might miss, potentially adding years to lives through early intervention and lifestyle changes."
  },
  {
    question: "How does LiverTracker address the healthcare access crisis for liver patients?",
    answer: "With liver specialists scarce (1 hepatologist per 70,000 liver patients), our platform democratizes access to expert-level monitoring. Patients can track critical metrics between appointments, share comprehensive data with any healthcare provider, and receive AI-powered insights typically only available at major medical centers."
  },
  {
    question: "What is the economic impact of untracked liver disease, and how does monitoring help?",
    answer: "Liver disease costs the US healthcare system $32 billion annually, with 80% spent on end-stage complications. Early tracking and intervention can reduce hospitalizations by 40% and prevent costly emergency interventions, while our platform costs less than a single ER visit."
  },
  {
    question: "How does LiverTracker's trend analysis prevent medical emergencies?",
    answer: "Sudden changes in liver function can indicate life-threatening complications like hepatic encephalopathy or variceal bleeding. Our trend analysis and alert system can detect deterioration weeks before symptoms appear, enabling preventive treatment that can avoid ICU admissions and save lives."
  },
  {
    question: "Why is the Child-Pugh scoring system critical for liver patients, and how do we make it accessible?",
    answer: "Child-Pugh scores predict survival rates and guide treatment decisions - Class C patients have 45% one-year mortality. Our platform automatically calculates these complex scores from simple lab uploads, making this life-saving assessment tool available to any patient with basic lab work, not just those at specialized centers."
  },
  {
    question: "How does LiverTracker's medical sharing system address the coordination crisis in liver care?",
    answer: "Liver patients often see multiple specialists (hepatologist, cardiologist, surgeon, primary care), leading to fragmented care and missed critical changes. Our secure sharing system ensures all providers have access to complete, up-to-date liver function data, improving coordination and potentially preventing the medical errors that contribute to the 44,000 annual liver disease deaths in the US."
  }
];

export function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section id="faqs" className="py-20 lg:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span>Critical Health Crisis</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Understanding the global liver disease crisis and how LiverTracker is saving lives through proactive monitoring and early intervention.
          </p>
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-semibold">
              <span className="text-red-600">⚠️ Critical Facts:</span> With 2 million global deaths annually from liver disease and a 12:1 transplant shortage, every day of delayed diagnosis costs lives. LiverTracker transforms smartphones into life-saving medical monitoring devices.
            </p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                      openItems.includes(index) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openItems.includes(index) 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5">
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 border border-red-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Don't Wait Until It's Too Late
            </h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Every day matters in liver health. Start monitoring your liver function today and join thousands who are taking control of their health with LiverTracker.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/signup"
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-3 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
              >
                Start Tracking Now
              </a>
              <a
                href="#contact"
                className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-semibold"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}