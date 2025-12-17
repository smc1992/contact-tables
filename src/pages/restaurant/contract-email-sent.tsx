import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useRouter } from 'next/router';

export default function ContractEmailSent() {
  const router = useRouter();
  const { success, email } = router.query;
  
  const isSuccess = success === 'true';

  // Animation-Varianten
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden p-8 md:p-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2
                }}
                className={`w-24 h-24 ${isSuccess ? 'bg-green-100' : 'bg-amber-100'} rounded-full flex items-center justify-center`}
              >
                {isSuccess ? (
                  <FiCheckCircle className="w-14 h-14 text-green-600" />
                ) : (
                  <FiAlertTriangle className="w-14 h-14 text-amber-600" />
                )}
              </motion.div>
            </div>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.h1 variants={itemVariants} className="text-3xl font-bold text-gray-800 mb-4">
                {isSuccess ? 'E-Mail gesendet!' : 'Aktion erforderlich'}
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-gray-600 mb-6">
                {isSuccess 
                  ? `Wir haben eine E-Mail mit dem Vertragslink an ${email || 'Ihre E-Mail-Adresse'} gesendet.`
                  : 'Es gibt noch offene Schritte, die abgeschlossen werden müssen.'}
              </motion.p>
              
              <motion.div variants={itemVariants} className={`${isSuccess ? 'bg-blue-50' : 'bg-amber-50'} p-4 rounded-lg mb-8`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FiMail className={`h-5 w-5 ${isSuccess ? 'text-blue-600' : 'text-amber-600'}`} />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${isSuccess ? 'text-blue-700' : 'text-amber-700'} text-left`}>
                      {isSuccess 
                        ? 'Bitte überprüfen Sie Ihren Posteingang und folgen Sie den Anweisungen in der E-Mail, um den Vertrag einzusehen und zu akzeptieren.'
                        : 'Bitte stellen Sie sicher, dass Sie alle erforderlichen Informationen bereitgestellt haben und versuchen Sie es erneut.'}
                    </p>
                  </div>
                </div>
              </motion.div>
              
              {isSuccess && (
                <motion.div variants={itemVariants} className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">Was ist zu tun?</h2>
                  
                  <ol className="space-y-4 text-left">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">1</span>
                      <span>Öffnen Sie die E-Mail mit dem Betreff "Ihr Contact Tables Vertrag".</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">2</span>
                      <span>Klicken Sie auf den Link in der E-Mail, um den Vertrag einzusehen.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">3</span>
                      <span>Lesen Sie den Vertrag sorgfältig durch und akzeptieren Sie die Bedingungen.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 bg-primary-100 text-primary-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">4</span>
                      <span>Nach der Vertragsannahme wird Ihr Restaurant auf unserer Plattform aktiviert.</span>
                    </li>
                  </ol>
                </motion.div>
              )}
              
              <motion.div 
                variants={itemVariants}
                className="mt-8"
              >
                <a 
                  href={isSuccess ? "/" : "/restaurant/dashboard"}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {isSuccess ? 'Zurück zur Startseite' : 'Zurück zum Dashboard'}
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
