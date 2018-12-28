import click

from objection.utils.frida_transport import FridaRunner
from objection.utils.helpers import clean_argument_flags
from objection.utils.templates import android_hook

@click.command()
@click.option('--search', help='Number of greetings.')
@click.option('--gadget', help='Process name.')

def var_class(args: list) -> None:
    search = str(search)
    if len(search) == 0:
        click.secho('Usage: android hooking search classes <name>', bold=True)
        return

    runner = FridaRunner()
    runner.set_hook_with_data(android_hook('hooking/search-class'), search=search)
    runner.run()

    response = runner.get_last_message()

    if not response.is_successful():
        click.secho('Failed to search for classes with error: {0}'.format(response.error_reason), fg='red')
        return None

    if response.data:

        # dump the classes to screen
        for classname in response.data:
            click.secho(classname)

        click.secho('\nFound {0} classes'.format(len(response.data)), bold=True)

    else:
        click.secho('No classes found')




import re
import sys

from objection.console.cli import cli

if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw?|\.exe)?$', '', sys.argv[0])
    sys.exit(cli())
