"use client";
import { motion } from "motion/react";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm">
        <div className="container mx-auto max-w-6xl px-4 flex w-full items-center">
          <div className="flex-1">
            <a className="btn btn-ghost text-xl text-accent">FirstModel</a>
          </div>
          <div className="flex-none gap-2">
            <a className="btn btn-ghost" href="/studio">
              Studio
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="hero min-h-[calc(100dvh-4rem)] bg-base-200">
        <div className="hero-content flex-col items-center gap-8">
          {/* Mobile-only badge above image */}
          <motion.div
            className="badge badge-outline mb-4 md:hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            An Autonomous ML Agent
          </motion.div>
          {/* Desktop-only badge above title+image row */}
          <motion.div
            className="badge badge-outline mb-2 hidden md:inline-flex"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            An Autonomous ML Agent
          </motion.div>
          {/* Side-by-side row on desktop: image and title */}
          <div className="w-full md:max-w-6xl md:flex md:flex-row md:items-center md:gap-10">
            {/* Image first on mobile, second on desktop */}
            <motion.div
              className="w-full md:max-w-xl md:order-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <img
                src="/demo.png"
                alt="FirstModel demo screenshot"
                className="w-full rounded-2xl shadow border border-base-300 -rotate-2"
              />
            </motion.div>
            {/* Title */}
            <motion.div
              className="max-w-3xl text-center md:text-left md:order-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.h1
                className="text-4xl md:text-6xl font-bold -rotate-2 inline-block pt-4 md:pt-0 md:pl-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                From dataset to <span className="text-accent">first model</span>{" "}
                in{" "}
                <span className="underline decoration-wavy decoration-6 underline-offset-8 decoration-accent">
                  minutes
                </span>
              </motion.h1>
            </motion.div>
          </div>

          {/* Centered below: text and buttons */}
          <motion.div
            className="max-w-3xl text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <p className="opacity-80">
              Start with a CSV, and FirstModel takes care of the rest —
              profiling your data, suggesting a training plan, and running
              scikit-learn models in the cloud. In just minutes, you can test
              predictions from your first model.
            </p>
            <motion.div
              className="mt-4 flex items-center justify-center gap-3 flex-wrap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <motion.a
                className="btn btn-primary"
                href="/studio"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Try it Out
              </motion.a>
              <motion.a
                className="btn btn-outline"
                href="#features"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore features
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Logos strip (placeholder) */}
      <section className="py-6">
        <div className="container mx-auto max-w-5xl opacity-70 text-sm flex flex-wrap items-center justify-center gap-6">
          <span>scikit‑learn</span>
          <span>Convex</span>
          <span>Modal</span>
          <span>pandas</span>
          <span>NumPy</span>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="container mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-20"
      >
        <div className="text-center mb-6">
          <div className="badge badge-outline mb-3">Features</div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Latest advanced tooling
          </h2>
          <p className="opacity-70">
            Everything you need for training your first model.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            className="card bg-base-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="card-body">
              <h3 className="card-title">Upload & Profile</h3>
              <p className="opacity-80">
                Upload CSVs securely to Convex. Automatic profiling spots
                missing values, imbalance, and types. Summaries are generated
                with LLM assistance.
              </p>
              <div className="card-actions justify-end">
                <a className="btn btn-sm" href="/studio">
                  Upload CSV Now
                </a>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="card bg-base-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          >
            <div className="card-body">
              <h3 className="card-title">Plan & Train</h3>
              <p className="opacity-80">
                The agent proposes a run config of classical sklearn models.
                We train in Modal, serialize with skops, and store artifacts in
                Convex.
              </p>
              <div className="card-actions justify-end">
                <a className="btn btn-sm" href="/studio">
                  Train Now
                </a>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="card bg-base-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          >
            <div className="card-body">
              <h3 className="card-title">Evaluate & Predict</h3>
              <p className="opacity-80">
                View a leaderboard with metrics, download models, and test
                predictions with an interactive form using your trained
                pipeline.
              </p>
              <div className="card-actions justify-end">
                <a className="btn btn-sm" href="/studio">
                  Test it Now
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="container mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-20">
        <motion.div
          className="hero rounded-box bg-base-300"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="hero-content text-center py-12">
            <div className="max-w-2xl">
              <h3 className="text-2xl md:text-3xl font-bold">
                Don’t replace. Integrate.
              </h3>
              <p className="opacity-80 mt-2">
                Keep your pandas workflows and sklearn pipelines. FirstModel
                handles the tedious preprocessing and baseline training, so you
                can skip to what matters: refining and tuning your best model
                family.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <a className="btn btn-primary" href="/studio">
                  Start for free
                </a>
                <a className="btn btn-outline" href="#features">
                  Learn more
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
