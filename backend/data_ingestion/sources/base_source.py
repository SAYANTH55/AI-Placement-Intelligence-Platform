from abc import ABC, abstractmethod

class BaseSource(ABC):
    @abstractmethod
    def process(self, data) -> dict:
        """
        Takes raw data input and returns a dictionary of standardized parsed outputs
        expected by the Schema Builder.
        """
        pass
