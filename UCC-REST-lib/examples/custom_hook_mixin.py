from splunktaucclib.rest_handler.base_hook_mixin import BaseHookMixin


class CustomHookMixin(BaseHookMixin):
    """ Base Hook Mixin class
    """
    def create_hook(self, config_name, stanza_id, payload):
        """Create hook called before the actual create action

        Args:
            config_name: configuration name
            stanza_id: the id of the stanza to create
            payload: data dict
        """
        pass

    def edit_hook(self, config_name, stanza_id, payload):
        """Edit hook called before the actual create action

        Args:
            config_name: configuration name
            stanza_id: the id of the stanza to edit
            payload: data dict
        """
        pass

    def delete_hook(self, config_name, stanza_id):
        """Delete hook called before the actual create action

        Args:
            config_name: configuration name
            stanza_id: the id of the stanza to delete
        """
        pass
