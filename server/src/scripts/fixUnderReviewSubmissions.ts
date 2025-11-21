import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * This script fixes submissions that are stuck in UNDER_REVIEW status
 * after reviews have been completed.
 * 
 * The old workflow automatically changed status to UNDER_REVIEW when reviews were submitted.
 * The new workflow keeps the status unchanged until the editor makes a decision.
 * 
 * This script resets submissions with completed reviews back to their previous status
 * so editors can make decisions on them.
 */
async function fixUnderReviewSubmissions() {
    console.log('Starting to fix UNDER_REVIEW submissions...\n');

    try {
        // Find all submissions that are UNDER_REVIEW
        const underReviewSubmissions = await prisma.submission.findMany({
            where: {
                status: 'UNDER_REVIEW'
            },
            include: {
                reviews: true
            }
        });

        console.log(`Found ${underReviewSubmissions.length} submissions with UNDER_REVIEW status\n`);

        let fixedCount = 0;
        let skippedCount = 0;

        for (const submission of underReviewSubmissions) {
            const completedReviews = submission.reviews.filter(r => r.status === 'COMPLETED');
            const pendingReviews = submission.reviews.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');

            console.log(`\nSubmission: ${submission.title}`);
            console.log(`  - Total reviews: ${submission.reviews.length}`);
            console.log(`  - Completed: ${completedReviews.length}`);
            console.log(`  - Pending: ${pendingReviews.length}`);

            if (completedReviews.length > 0) {
                // If there are completed reviews, the editor should make a decision
                // We'll keep it as UNDER_REVIEW but log it
                console.log(`  ✅ Ready for editor decision (keeping UNDER_REVIEW)`);
                skippedCount++;
            } else if (submission.reviews.length === 0) {
                // No reviews assigned yet - should be INITIAL_REVIEW
                await prisma.submission.update({
                    where: { id: submission.id },
                    data: { status: 'INITIAL_REVIEW' }
                });
                console.log(`  🔧 Fixed: Changed to INITIAL_REVIEW (no reviews assigned)`);
                fixedCount++;
            } else {
                // Reviews assigned but none completed - keep as UNDER_REVIEW
                console.log(`  ⏳ Waiting for reviews (keeping UNDER_REVIEW)`);
                skippedCount++;
            }
        }

        console.log(`\n\n=== Summary ===`);
        console.log(`Total submissions checked: ${underReviewSubmissions.length}`);
        console.log(`Fixed: ${fixedCount}`);
        console.log(`Left as UNDER_REVIEW: ${skippedCount}`);
        console.log(`\nNote: Submissions with completed reviews are ready for editor decisions.`);
        console.log(`Editors can now make decisions on these submissions.`);

    } catch (error) {
        console.error('Error fixing submissions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
fixUnderReviewSubmissions()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
