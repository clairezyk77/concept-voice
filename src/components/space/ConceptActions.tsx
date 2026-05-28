import { useExploration } from '../../hooks/useExploration.ts';
import { Button } from '../ui/Button.tsx';
import { useNavigate } from 'react-router-dom';

export function ConceptActions() {
  const navigate = useNavigate();
  const {
    handleRefresh,
    handleExpand,
    handleGoBack,
    canGoBack,
  } = useExploration();

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          disabled={!canGoBack}
          className="transition-all duration-200"
        >
          ← Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/knowledge')}
          className="transition-all duration-200"
        >
          ◇ Knowledge
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExpand}
          className="transition-all duration-200"
        >
          ⊞ Expand
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleRefresh}
          className="transition-all duration-200"
        >
          ⟳ Refresh
        </Button>
      </div>
    </div>
  );
}
