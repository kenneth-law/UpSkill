-- Migration to add sitewide_progress column to users_profile table
ALTER TABLE users_profile 
ADD COLUMN sitewide_progress DECIMAL(5,2) DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN users_profile.sitewide_progress IS 'Overall learning progress percentage across all courses (0-100)';

-- Create a function to update sitewide_progress based on game_sessions
CREATE OR REPLACE FUNCTION update_sitewide_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    progress DECIMAL(5,2);
BEGIN
    -- Count total lessons for the user
    SELECT COUNT(DISTINCT l.id) INTO total_lessons
    FROM lessons l
    JOIN study_plans sp ON l.study_plan_id = sp.id
    JOIN topics t ON sp.topic_id = t.id
    WHERE t.user_id = NEW.user_id;
    
    -- Count completed lessons (lessons with completed game sessions)
    SELECT COUNT(DISTINCT gs.lesson_id) INTO completed_lessons
    FROM game_sessions gs
    WHERE gs.user_id = NEW.user_id AND gs.completed = true;
    
    -- Calculate progress percentage
    IF total_lessons > 0 THEN
        progress := (completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100;
    ELSE
        progress := 0;
    END IF;
    
    -- Update the user's sitewide_progress
    UPDATE users_profile
    SET sitewide_progress = progress
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update sitewide_progress when a game_session is completed
CREATE TRIGGER update_user_sitewide_progress
AFTER INSERT OR UPDATE OF completed ON game_sessions
FOR EACH ROW
WHEN (NEW.completed = true)
EXECUTE FUNCTION update_sitewide_progress();